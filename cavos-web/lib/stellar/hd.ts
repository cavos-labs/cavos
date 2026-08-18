/**
 * SEP-0005 / SLIP-0010 ed25519 derivation for per-org Stellar sponsor keys.
 *
 * Path: m/44'/148'/{account}'
 *
 * The master seed is the raw 32-byte ed25519 seed of STELLAR_RELAYER_SECRET.
 * Children are NOT the same G-address as that secret — the original key stays
 * the legacy shared account; org sponsors start at index 1.
 *
 * Secrets never leave this process. The database stores only (public_key, index).
 */
import { createHmac } from 'crypto';
import { Keypair } from '@stellar/stellar-sdk';

const HARDENED = 0x80000000;
const STELLAR_PURPOSE = 44;
const STELLAR_COIN_TYPE = 148;

export function slip0010Master(seed: Buffer): { key: Buffer; chain: Buffer } {
  const I = createHmac('sha512', 'ed25519 seed').update(seed).digest();
  return { key: I.subarray(0, 32), chain: I.subarray(32) };
}

/** One hardened CKD step. `index` is the unhardened value (0..2^31-1). */
export function slip0010CkdHardened(
  key: Buffer,
  chain: Buffer,
  index: number,
): { key: Buffer; chain: Buffer } {
  if (!Number.isInteger(index) || index < 0 || index >= HARDENED) {
    throw new Error(`slip0010: index out of range: ${index}`);
  }
  const data = Buffer.alloc(37);
  data[0] = 0x00;
  key.copy(data, 1);
  data.writeUInt32BE(HARDENED + index, 33);
  const I = createHmac('sha512', chain).update(data).digest();
  return { key: I.subarray(0, 32), chain: I.subarray(32) };
}

/** Derive the Stellar Keypair at m/44'/148'/{accountIndex}'. */
export function deriveStellarAccount(seed: Buffer, accountIndex: number): Keypair {
  if (!Number.isInteger(accountIndex) || accountIndex < 1) {
    throw new Error(`deriveStellarAccount: accountIndex must be >= 1, got ${accountIndex}`);
  }
  let node = slip0010Master(seed);
  node = slip0010CkdHardened(node.key, node.chain, STELLAR_PURPOSE);
  node = slip0010CkdHardened(node.key, node.chain, STELLAR_COIN_TYPE);
  node = slip0010CkdHardened(node.key, node.chain, accountIndex);
  return Keypair.fromRawEd25519Seed(node.key);
}
