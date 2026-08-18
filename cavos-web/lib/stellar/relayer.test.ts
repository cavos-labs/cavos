import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  Account,
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import {
  passphraseFor,
  validateClassicCreate,
  validateClassicFeeBump,
  validateClassicTrustline,
  validateSponsoredData,
} from './relayer';

const NETWORK = 'stellar-testnet' as const;
const PASSPHRASE = passphraseFor(NETWORK);

const RELAYER = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 1)).publicKey();
const ACCOUNT = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 2)).publicKey();
const OUTSIDER = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 3)).publicKey();
const ISSUER = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 4)).publicKey();

const USDC = { code: 'USDC', issuer: ISSUER };

/** Build a relayer-sourced transaction out of the given operations. */
function build(ops: ReturnType<typeof Operation.manageData>[], source = RELAYER) {
  const builder = new TransactionBuilder(new Account(source, '1'), {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  });
  for (const op of ops) builder.addOperation(op);
  return builder.setTimeout(120).build();
}

const begin = (sponsoredId = ACCOUNT) =>
  Operation.beginSponsoringFutureReserves({ sponsoredId, source: RELAYER });
const end = (source = ACCOUNT) => Operation.endSponsoringFutureReserves({ source });
const trust = (asset: { code: string; issuer: string }, limit?: string, source = ACCOUNT) =>
  Operation.changeTrust({ asset: new Asset(asset.code, asset.issuer), limit, source });

describe('validateClassicTrustline', () => {
  it('sponsors a trustline the account authorises', () => {
    const tx = build([begin(), trust(USDC), end()]);
    assert.deepEqual(validateClassicTrustline(tx, RELAYER), { ok: true });
  });

  it('sponsors any classic asset — there is no per-asset allowlist', () => {
    const tx = build([begin(), trust({ code: 'EURC', issuer: OUTSIDER }), end()]);
    assert.deepEqual(validateClassicTrustline(tx, RELAYER), { ok: true });
  });

  it('allows closing a trustline', () => {
    const tx = build([begin(), trust(USDC, '0'), end()]);
    assert.deepEqual(validateClassicTrustline(tx, RELAYER), { ok: true });
  });

  it('refuses XLM, which needs no trustline', () => {
    const tx = build([
      begin(),
      Operation.changeTrust({ asset: Asset.native(), source: ACCOUNT }),
      end(),
    ]);
    assert.equal(validateClassicTrustline(tx, RELAYER).ok, false);
  });

  it('refuses a trustline sourced by anyone but the sponsored account', () => {
    const tx = build([begin(), trust(USDC, undefined, OUTSIDER), end()]);
    const res = validateClassicTrustline(tx, RELAYER);
    assert.equal(res.ok, false);
    assert.match(res.reason!, /sourced by the sponsored account/);
  });

  it('refuses a payment smuggled into the envelope', () => {
    const tx = build([
      begin(),
      Operation.payment({
        destination: OUTSIDER,
        asset: Asset.native(),
        amount: '100',
        source: RELAYER,
      }),
      end(),
    ]);
    const res = validateClassicTrustline(tx, RELAYER);
    assert.equal(res.ok, false);
    assert.match(res.reason!, /payment is not allowed/);
  });

  it('refuses a data write smuggled in beside a legitimate trustline', () => {
    const tx = build([
      begin(),
      trust(USDC),
      Operation.manageData({ name: 'cv:ct/0', value: 'x', source: ACCOUNT }),
      end(),
    ]);
    assert.equal(validateClassicTrustline(tx, RELAYER).ok, false);
  });

  it('refuses a transaction the relayer does not source', () => {
    const tx = build([begin(), trust(USDC), end()], OUTSIDER);
    const res = validateClassicTrustline(tx, RELAYER);
    assert.equal(res.ok, false);
    assert.match(res.reason!, /source must be the Cavos relayer/);
  });

  it('refuses sponsoring the relayer itself', () => {
    const tx = build([begin(RELAYER), trust(USDC, undefined, RELAYER), end(RELAYER)]);
    assert.equal(validateClassicTrustline(tx, RELAYER).ok, false);
  });

  it('refuses an unterminated envelope', () => {
    const tx = build([begin(), trust(USDC), trust(USDC)]);
    const res = validateClassicTrustline(tx, RELAYER);
    assert.equal(res.ok, false);
    assert.match(res.reason!, /endSponsoringFutureReserves/);
  });
});

describe('validateSponsoredData', () => {
  it('accepts cv: data writes', () => {
    const tx = build([
      begin(),
      Operation.manageData({ name: 'cv:ct/0', value: 'x', source: ACCOUNT }),
      end(),
    ]);
    assert.deepEqual(validateSponsoredData(tx, RELAYER), { ok: true });
  });

  it('refuses data outside the cv: namespace', () => {
    const tx = build([
      begin(),
      Operation.manageData({ name: 'other', value: 'x', source: ACCOUNT }),
      end(),
    ]);
    assert.equal(validateSponsoredData(tx, RELAYER).ok, false);
  });

  it('refuses a trustline — that is the trustline gate\'s job', () => {
    const tx = build([begin(), trust(USDC), end()]);
    const res = validateSponsoredData(tx, RELAYER);
    assert.equal(res.ok, false);
    assert.match(res.reason!, /changeTrust is not allowed/);
  });

  it('refuses reviving the master key', () => {
    const tx = build([
      begin(),
      Operation.setOptions({ masterWeight: 1, signer: { ed25519PublicKey: OUTSIDER, weight: 1 }, source: ACCOUNT }),
      end(),
    ]);
    assert.equal(validateSponsoredData(tx, RELAYER).ok, false);
  });

  it('refuses adding the relayer as a signer', () => {
    const tx = build([
      begin(),
      Operation.setOptions({ signer: { ed25519PublicKey: RELAYER, weight: 1 }, source: ACCOUNT }),
      end(),
    ]);
    assert.equal(validateSponsoredData(tx, RELAYER).ok, false);
  });

  it('accepts a control-key rotation', () => {
    const tx = build([
      begin(),
      Operation.setOptions({ signer: { ed25519PublicKey: OUTSIDER, weight: 1 }, source: ACCOUNT }),
      Operation.setOptions({ signer: { ed25519PublicKey: ACCOUNT, weight: 0 }, source: ACCOUNT }),
      end(),
    ]);
    assert.deepEqual(validateSponsoredData(tx, RELAYER), { ok: true });
  });
});

describe('validateClassicCreate', () => {
  const create = () =>
    Operation.createAccount({ destination: ACCOUNT, startingBalance: '0', source: RELAYER });
  const zeroMaster = () => Operation.setOptions({ masterWeight: 0, source: ACCOUNT });

  it('accepts a zero-balance sponsored create that kills the master key', () => {
    const tx = build([begin(), create(), zeroMaster(), end()]);
    assert.deepEqual(validateClassicCreate(tx, RELAYER), { ok: true });
  });

  it('refuses a create that funds the new account from the relayer', () => {
    const tx = build([
      begin(),
      Operation.createAccount({ destination: ACCOUNT, startingBalance: '100', source: RELAYER }),
      zeroMaster(),
      end(),
    ]);
    const res = validateClassicCreate(tx, RELAYER);
    assert.equal(res.ok, false);
    assert.match(res.reason!, /starting balance must be 0/);
  });

  it('refuses a create that leaves the master key alive', () => {
    const tx = build([begin(), create(), end()]);
    const res = validateClassicCreate(tx, RELAYER);
    assert.equal(res.ok, false);
    assert.match(res.reason!, /zero the master weight/);
  });

  it('refuses a trustline inside a create', () => {
    const tx = build([begin(), create(), zeroMaster(), trust(USDC), end()]);
    assert.equal(validateClassicCreate(tx, RELAYER).ok, false);
  });
});

describe('validateClassicFeeBump', () => {
  const inner = (source: string) =>
    new TransactionBuilder(new Account(source, '1'), {
      fee: BASE_FEE,
      networkPassphrase: PASSPHRASE,
    })
      .addOperation(
        Operation.payment({ destination: OUTSIDER, asset: Asset.native(), amount: '1' }),
      )
      .setTimeout(120)
      .build();

  it('pays for a user-sourced inner transaction', () => {
    const fb = TransactionBuilder.buildFeeBumpTransaction(
      RELAYER,
      BASE_FEE,
      inner(ACCOUNT),
      PASSPHRASE,
    );
    assert.deepEqual(validateClassicFeeBump(fb, RELAYER), { ok: true });
  });

  it('refuses to be the spender itself', () => {
    const fb = TransactionBuilder.buildFeeBumpTransaction(
      RELAYER,
      BASE_FEE,
      inner(RELAYER),
      PASSPHRASE,
    );
    const res = validateClassicFeeBump(fb, RELAYER);
    assert.equal(res.ok, false);
    assert.match(res.reason!, /inner transaction source cannot be the relayer/);
  });
});
