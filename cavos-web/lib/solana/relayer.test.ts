import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey, SystemProgram, Transaction, type TransactionInstruction } from '@solana/web3.js';
import { validateNativeSponsoredTransaction } from './relayer';

const RELAYER = Keypair.fromSeed(Buffer.alloc(32, 1));
const USER = Keypair.fromSeed(Buffer.alloc(32, 2));
const OUTSIDER = Keypair.fromSeed(Buffer.alloc(32, 3)).publicKey;
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const BLOCKHASH = '11111111111111111111111111111111';

const userTransfer = () =>
  SystemProgram.transfer({ fromPubkey: USER.publicKey, toPubkey: OUTSIDER, lamports: 1 });

/** A user-signed transaction as the relay route parses it off the wire. */
function received(instructions: TransactionInstruction[], signers = [USER]): Transaction {
  const tx = new Transaction();
  tx.feePayer = RELAYER.publicKey;
  tx.recentBlockhash = BLOCKHASH;
  tx.add(...instructions);
  tx.partialSign(...signers);
  return Transaction.from(tx.serialize({ requireAllSignatures: false, verifySignatures: false }));
}

const validate = (tx: Transaction) => validateNativeSponsoredTransaction(tx, RELAYER.publicKey);

describe('validateNativeSponsoredTransaction', () => {
  it('pays the fee of a transaction the user signed', () => {
    assert.deepEqual(validate(received([userTransfer()])), { ok: true });
  });

  it('refuses every instruction that names the relayer', () => {
    const funded = Keypair.fromSeed(Buffer.alloc(32, 4));
    const cases: [TransactionInstruction, Keypair[]][] = [
      [SystemProgram.transfer({ fromPubkey: RELAYER.publicKey, toPubkey: OUTSIDER, lamports: 1 }), [USER]],
      [
        SystemProgram.createAccount({
          fromPubkey: RELAYER.publicKey,
          newAccountPubkey: funded.publicKey,
          lamports: 1_000_000_000,
          space: 0,
          programId: SystemProgram.programId,
        }),
        [USER, funded],
      ],
      [SystemProgram.assign({ accountPubkey: RELAYER.publicKey, programId: TOKEN_PROGRAM }), [USER]],
      [SystemProgram.transfer({ fromPubkey: USER.publicKey, toPubkey: RELAYER.publicKey, lamports: 1 }), [USER]],
    ];
    for (const [instruction, signers] of cases) {
      const res = validate(received([userTransfer(), instruction], signers));
      assert.equal(res.ok, false);
      assert.match(res.reason!, /relayer may only pay the fee/);
    }
  });

  it('refuses a transaction no user signed', () => {
    const tx = new Transaction();
    tx.feePayer = RELAYER.publicKey;
    tx.recentBlockhash = BLOCKHASH;
    tx.add(userTransfer());
    const res = validate(tx);
    assert.equal(res.ok, false);
    assert.match(res.reason!, /missing the user signature/);
  });

  it('refuses a fee payer other than the relayer', () => {
    const tx = received([userTransfer()]);
    tx.feePayer = USER.publicKey;
    assert.equal(validate(tx).ok, false);
  });

  it('refuses a program outside the allowlist', () => {
    const instruction = { programId: OUTSIDER, keys: [], data: Buffer.alloc(0) };
    assert.equal(validate(received([userTransfer(), instruction])).ok, false);
  });
});
