import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  MAX_SPONSORED_ATA_CREATIONS,
  validateNativeSponsoredTransaction,
} from './relayer';

const RELAYER = Keypair.fromSeed(Buffer.alloc(32, 1)).publicKey;
const USER = Keypair.fromSeed(Buffer.alloc(32, 2)).publicKey;
const OUTSIDER = Keypair.fromSeed(Buffer.alloc(32, 3)).publicKey;
const MINT = Keypair.fromSeed(Buffer.alloc(32, 4)).publicKey;

const ATA_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

/** A relayer-paid transaction carrying a user signature, as the SDK submits it. */
function build(instructions: TransactionInstruction[], signer: PublicKey = USER): Transaction {
  const tx = new Transaction();
  tx.feePayer = RELAYER;
  tx.recentBlockhash = '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi';
  tx.add(...instructions);
  tx.addSignature(signer, Buffer.alloc(64, 7));
  return tx;
}

/**
 * How the drain would actually arrive: the attacker signs an innocuous
 * instruction of their own so the transaction carries a user signature, and
 * hides the instruction that spends the relayer next to it.
 */
function attack(malicious: TransactionInstruction): Transaction {
  return build([userTransfer(), malicious]);
}

const userTransfer = () =>
  SystemProgram.transfer({ fromPubkey: USER, toPubkey: OUTSIDER, lamports: 1_000 });

function ataCreate(payer: PublicKey, owner: PublicKey, data = Buffer.alloc(0)) {
  return new TransactionInstruction({
    programId: ATA_PROGRAM,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: Keypair.generate().publicKey, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: MINT, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/** SPL Token Transfer: [source, destination, authority]. */
function splTransfer(source: PublicKey, authority: PublicKey) {
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: OUTSIDER, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([3, ...new Array(8).fill(0xff)]),
  });
}

describe('validateNativeSponsoredTransaction — accepts', () => {
  it('a plain user transfer', () => {
    const r = validateNativeSponsoredTransaction(build([userTransfer()]), RELAYER);
    assert.equal(r.ok, true);
  });

  it('a relayer-funded token account for the user', () => {
    const r = validateNativeSponsoredTransaction(
      build([ataCreate(RELAYER, USER), userTransfer()]),
      RELAYER,
    );
    assert.equal(r.ok, true);
  });

  it('the idempotent variant of that create', () => {
    const r = validateNativeSponsoredTransaction(
      build([userTransfer(), ataCreate(RELAYER, USER, Buffer.from([1]))]),
      RELAYER,
    );
    assert.equal(r.ok, true);
  });

  it('a modest priority fee', () => {
    const tx = build([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
      userTransfer(),
    ]);
    assert.equal(validateNativeSponsoredTransaction(tx, RELAYER).ok, true);
  });
});

describe('validateNativeSponsoredTransaction — drains the relayer', () => {
  it('rejects a System transfer from the relayer', () => {
    const ix = SystemProgram.transfer({
      fromPubkey: RELAYER,
      toPubkey: OUTSIDER,
      lamports: 1_000_000_000,
    });
    assert.equal(validateNativeSponsoredTransaction(attack(ix), RELAYER).ok, false);
  });

  it('rejects CreateAccount funded by the relayer', () => {
    // Discriminant 0, not 2 — this passed the earlier Transfer-only check.
    const ix = SystemProgram.createAccount({
      fromPubkey: RELAYER,
      newAccountPubkey: Keypair.generate().publicKey,
      lamports: 1_000_000_000,
      space: 0,
      programId: SystemProgram.programId,
    });
    const r = validateNativeSponsoredTransaction(attack(ix), RELAYER);
    assert.equal(r.ok, false);
    assert.match(r.reason!, /spend from the relayer/);
  });

  it('rejects CreateAccountWithSeed funded by the relayer', () => {
    const ix = SystemProgram.createAccountWithSeed({
      fromPubkey: RELAYER,
      newAccountPubkey: Keypair.generate().publicKey,
      basePubkey: RELAYER,
      seed: 'x',
      lamports: 1_000_000_000,
      space: 0,
      programId: SystemProgram.programId,
    });
    const r = validateNativeSponsoredTransaction(attack(ix), RELAYER);
    assert.equal(r.ok, false);
  });

  it('rejects an SPL transfer authorized by the relayer', () => {
    // Live the moment the relayer holds a token balance, e.g. to take fees in USDC.
    const relayerAta = Keypair.generate().publicKey;
    const r = validateNativeSponsoredTransaction(attack(splTransfer(relayerAta, RELAYER)), RELAYER);
    assert.equal(r.ok, false);
    assert.match(r.reason!, /spend from the relayer/);
  });

  it('rejects ATA RecoverNested, which moves tokens', () => {
    const r = validateNativeSponsoredTransaction(attack(ataCreate(RELAYER, USER, Buffer.from([2]))), RELAYER);
    assert.equal(r.ok, false);
  });

  it('rejects an ATA create that the relayer both funds and owns', () => {
    const r = validateNativeSponsoredTransaction(attack(ataCreate(RELAYER, RELAYER)), RELAYER);
    assert.equal(r.ok, false);
  });

  it('caps relayer-funded token accounts per transaction', () => {
    const creates = Array.from({ length: MAX_SPONSORED_ATA_CREATIONS + 1 }, () =>
      ataCreate(RELAYER, USER),
    );
    const r = validateNativeSponsoredTransaction(build([userTransfer(), ...creates]), RELAYER);
    assert.equal(r.ok, false);
    assert.match(r.reason!, /relayer-funded token accounts/);
  });
});

describe('validateNativeSponsoredTransaction — compute budget', () => {
  it('rejects a compute unit limit above the cap', () => {
    const tx = build([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      userTransfer(),
    ]);
    const r = validateNativeSponsoredTransaction(tx, RELAYER);
    assert.equal(r.ok, false);
    assert.match(r.reason!, /compute units/);
  });

  it('rejects an unbounded priority fee', () => {
    // 1.4M units at 1e9 micro-lamports is ~1.4 SOL, charged to the relayer.
    const tx = build([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000_000 }),
      userTransfer(),
    ]);
    const r = validateNativeSponsoredTransaction(tx, RELAYER);
    assert.equal(r.ok, false);
    assert.match(r.reason!, /priority fee/);
  });

  it('bounds the priority fee when no unit limit is requested', () => {
    // No SetComputeUnitLimit: Solana still charges price x the default limit.
    const tx = build([
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000_000 }),
      userTransfer(),
    ]);
    const r = validateNativeSponsoredTransaction(tx, RELAYER);
    assert.equal(r.ok, false);
    assert.match(r.reason!, /priority fee/);
  });
});

describe('validateNativeSponsoredTransaction — basics', () => {
  it('rejects a transaction the user did not sign', () => {
    const tx = new Transaction();
    tx.feePayer = RELAYER;
    tx.recentBlockhash = '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi';
    tx.add(userTransfer());
    const r = validateNativeSponsoredTransaction(tx, RELAYER);
    assert.equal(r.ok, false);
    assert.match(r.reason!, /missing the user signature/);
  });

  it('rejects a fee payer that is not the relayer', () => {
    const tx = build([userTransfer()]);
    tx.feePayer = OUTSIDER;
    assert.equal(validateNativeSponsoredTransaction(tx, RELAYER).ok, false);
  });

  it('rejects an unlisted program', () => {
    const ix = new TransactionInstruction({
      programId: Keypair.generate().publicKey,
      keys: [{ pubkey: USER, isSigner: true, isWritable: true }],
      data: Buffer.alloc(0),
    });
    const r = validateNativeSponsoredTransaction(build([ix]), RELAYER);
    assert.equal(r.ok, false);
    assert.match(r.reason!, /non-whitelisted/);
  });

  it('allows a program the app listed', () => {
    const program = Keypair.generate().publicKey;
    const ix = new TransactionInstruction({
      programId: program,
      keys: [{ pubkey: USER, isSigner: true, isWritable: true }],
      data: Buffer.alloc(0),
    });
    const r = validateNativeSponsoredTransaction(build([ix]), RELAYER, [program.toBase58()]);
    assert.equal(r.ok, true);
  });

  it('rejects an empty transaction', () => {
    const tx = build([userTransfer()]);
    tx.instructions = [];
    assert.equal(validateNativeSponsoredTransaction(tx, RELAYER).ok, false);
  });
});
