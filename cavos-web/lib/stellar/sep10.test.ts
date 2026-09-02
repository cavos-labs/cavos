import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  Account,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import {
  SEP10_TESTNET_PASSPHRASE,
  validateSep10Request,
  signSep10Transaction,
} from './sep10';

const TESTNET_PASSPHRASE = SEP10_TESTNET_PASSPHRASE;
const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

const FIXTURE_SERVER = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 1));
const FIXTURE_CLIENT = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 2));
const FIXTURE_SIGNER = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 3));

function buildSep10Challenge(opts: {
  txSequence?: string;
  passphrase?: string;
  serverPublicKey?: string;
  clientPublicKey?: string;
} = {}): string {
  const {
    txSequence = '0',
    passphrase = TESTNET_PASSPHRASE,
    serverPublicKey = FIXTURE_SERVER.publicKey(),
    clientPublicKey = FIXTURE_CLIENT.publicKey(),
  } = opts;

  const accountSequence = (BigInt(txSequence) - BigInt(1)).toString();
  const account = new Account(serverPublicKey, accountSequence);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(
      Operation.manageData({
        name: `${serverPublicKey} auth`,
        value: Buffer.alloc(48),
        source: clientPublicKey,
      }),
    )
    .addOperation(
      Operation.manageData({
        name: 'web_auth_domain',
        value: 'anchor.example.com',
        source: serverPublicKey,
      }),
    )
    .setTimeout(300)
    .build();

  return tx.toEnvelope().toXDR('base64');
}

describe('validateSep10Request', () => {
  it('accepts a valid SEP-10 challenge (sequence 0, testnet passphrase)', () => {
    const xdr = buildSep10Challenge();
    const result = validateSep10Request({
      transaction: xdr,
      network_passphrase: TESTNET_PASSPHRASE,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.tx.sequence, '0');
    }
  });

  it('rejects a transaction with sequence !== 0', () => {
    const xdr = buildSep10Challenge({ txSequence: '12345' });
    const result = validateSep10Request({
      transaction: xdr,
      network_passphrase: TESTNET_PASSPHRASE,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.match(result.error, /sequence number must be 0/);
    }
  });

  it('rejects wrong network_passphrase (mainnet instead of testnet)', () => {
    const xdr = buildSep10Challenge({ passphrase: TESTNET_PASSPHRASE });
    const result = validateSep10Request({
      transaction: xdr,
      network_passphrase: MAINNET_PASSPHRASE,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.match(result.error, /Invalid network_passphrase/);
    }
  });

  it('rejects invalid XDR', () => {
    const result = validateSep10Request({
      transaction: 'not-valid-xdr',
      network_passphrase: TESTNET_PASSPHRASE,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.match(result.error, /Invalid transaction XDR/);
    }
  });

  it('rejects missing transaction field', () => {
    const result = validateSep10Request({
      transaction: undefined as unknown as string,
      network_passphrase: TESTNET_PASSPHRASE,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
    }
  });

  it('rejects missing network_passphrase field', () => {
    const xdr = buildSep10Challenge();
    const result = validateSep10Request({
      transaction: xdr,
      network_passphrase: undefined as unknown as string,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
    }
  });

  it('rejects fee-bump transactions', () => {
    const innerTx = new TransactionBuilder(
      new Account(FIXTURE_SERVER.publicKey(), '0'),
      { fee: BASE_FEE, networkPassphrase: TESTNET_PASSPHRASE },
    )
      .addOperation(
        Operation.manageData({
          name: 'test',
          value: 'value',
          source: FIXTURE_CLIENT.publicKey(),
        }),
      )
      .setTimeout(300)
      .build();

    const feeBump = TransactionBuilder.buildFeeBumpTransaction(
      FIXTURE_SERVER,
      (Number(BASE_FEE) * 2).toString(),
      innerTx,
      TESTNET_PASSPHRASE,
    );

    const result = validateSep10Request({
      transaction: feeBump.toEnvelope().toXDR('base64'),
      network_passphrase: TESTNET_PASSPHRASE,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
      assert.match(result.error, /Fee-bump transactions are not supported/);
    }
  });
});

describe('signSep10Transaction', () => {
  it('signs the transaction and returns valid XDR', () => {
    const xdr = buildSep10Challenge();
    const validation = validateSep10Request({
      transaction: xdr,
      network_passphrase: TESTNET_PASSPHRASE,
    });
    assert.equal(validation.ok, true);
    if (!validation.ok) return;

    const result = signSep10Transaction(
      validation.tx,
      FIXTURE_SIGNER.secret(),
      TESTNET_PASSPHRASE,
    );

    assert.equal(result.ok, true);
    assert.equal(result.network_passphrase, TESTNET_PASSPHRASE);
    assert.equal(typeof result.transaction, 'string');
    assert.ok(result.transaction.length > 0, 'signed XDR should not be empty');

    const signedTx = TransactionBuilder.fromXDR(
      result.transaction,
      TESTNET_PASSPHRASE,
    );
    assert.ok(
      signedTx.signatures.length > 0,
      'signed transaction should have at least one signature',
    );
  });

  it('adds the client_domain signer signature to the transaction', () => {
    const xdr = buildSep10Challenge();
    const validation = validateSep10Request({
      transaction: xdr,
      network_passphrase: TESTNET_PASSPHRASE,
    });
    assert.equal(validation.ok, true);
    if (!validation.ok) return;

    const originalSignatureCount = validation.tx.signatures.length;

    const result = signSep10Transaction(
      validation.tx,
      FIXTURE_SIGNER.secret(),
      TESTNET_PASSPHRASE,
    );

    assert.equal(result.ok, true);
    const signedTx = TransactionBuilder.fromXDR(
      result.transaction,
      TESTNET_PASSPHRASE,
    );
    assert.equal(
      signedTx.signatures.length,
      originalSignatureCount + 1,
      'should add exactly one signature',
    );
  });
});
