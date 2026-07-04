/**
 * Deploy Attestation Signing
 *
 * Issues the secp256r1 (P-256) attestation signature that the on-chain
 * `DeviceAccount.initialize` verifies before registering a device signer.
 *
 * Why this exists: the account address is now `f(address_seed)` only — no
 * device pubkey — so the address is recomputable by the user from
 * `(userId, appSalt)` even after losing every device (self-custodial recovery).
 * The trade-off is that anyone could compute a victim's address and front-run
 * the deploy. The attestation closes that hole: the constructor takes only the
 * seed (so the address is seed-bound), but `initialize` requires a signature
 * from this key — held only by the Cavos backend — over the exact
 * `(address_seed, device_pubkey)` being registered.
 *
 * The matching public key is hardcoded in the contract as
 * `ATTESTATION_SIGNER_ID`. Rotating the key means deploying a new class hash.
 *
 * Digest signed: sha256(address_seed_be32 || pub_x_be32 || pub_y_be32)
 * — identical to what `attestation_digest` in device_account.cairo computes.
 *
 * Signing uses @noble/curves p256.sign(digest, key) which signs the RAW digest
 * (no re-hash). This matches the on-chain verifier, which does
 * `recover_public_key(digest, sig)` directly. Using Node crypto's createSign
 * would double-hash (it hashes the message before signing), producing a
 * signature the contract rejects.
 */

import { createHash } from 'crypto';
import { p256 } from '@noble/curves/p256';

/** secp256r1 curve order, for low-s normalisation. */
const SECP256R1_N =
  0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

/**
 * The attestation private key as raw 32-byte hex, parsed from the
 * CAVOS_ATTESTATION_PRIVATE_KEY PEM at module load. Throws if the env var is
 * missing or the PEM is malformed.
 */
function attestationPrivateKey(): Uint8Array {
  const pem = process.env.CAVOS_ATTESTATION_PRIVATE_KEY;
  if (!pem) {
    throw new Error('CAVOS_ATTESTATION_PRIVATE_KEY is not set');
  }
  // Parse PKCS#8 PEM → raw scalar. Node crypto can't extract the raw scalar
  // directly from a KeyObject, so we use the JWK form which exposes `d`.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createPrivateKey } = require('crypto');
  const keyObj = createPrivateKey({ key: pem, format: 'pem' });
  const jwk = keyObj.export({ format: 'jwk' });
  if (!jwk.d) {
    throw new Error('CAVOS_ATTESTATION_PRIVATE_KEY is not an EC P-256 private key');
  }
  // `d` is base64url-encoded raw scalar.
  return Buffer.from(jwk.d, 'base64url');
}

/**
 * Compute the 32-byte attestation digest for a given (addressSeed, devicePubkey).
 * Mirrors `attestation_digest` in device_account.cairo byte-for-byte:
 *   sha256(addressSeed_be32 || pub_x_be32 || pub_y_be32)
 *
 * All inputs are hex strings (e.g. "0x1234...") to avoid bigint parsing
 * ambiguity across felt252 / u256 boundaries.
 */
export function attestationDigest(
  addressSeedHex: string,
  pubXHex: string,
  pubYHex: string,
): Buffer {
  const seed = BigInt(addressSeedHex);
  const x = BigInt(pubXHex);
  const y = BigInt(pubYHex);
  return createHash('sha256')
    .update(bigIntTo32BytesBE(seed))
    .update(bigIntTo32BytesBE(x))
    .update(bigIntTo32BytesBE(y))
    .digest();
}

/**
 * Solana attestation digest. The program recovers over the *compressed* device
 * key (0x02/0x03 || X), mirroring `attestation_message` in the Solana program:
 *   sha256(addressSeed_be32 || compressed_pubkey_33)
 */
export function attestationDigestSolana(
  addressSeedHex: string,
  pubXHex: string,
  pubYHex: string,
): Buffer {
  const prefix = (BigInt(pubYHex) & 1n) === 0n ? 0x02 : 0x03;
  return createHash('sha256')
    .update(bigIntTo32BytesBE(BigInt(addressSeedHex)))
    .update(Buffer.from([prefix]))
    .update(bigIntTo32BytesBE(BigInt(pubXHex)))
    .digest();
}

/** Sign a precomputed 32-byte attestation digest, low-s normalised. */
function signDigest(digest: Buffer): { r: string; s: string; y_parity: boolean } {
  const privKey = attestationPrivateKey();
  const sig = p256.sign(digest, privKey);
  const halfN = SECP256R1_N / 2n;
  let lowS = sig.s;
  let recovery = sig.recovery;
  if (lowS > halfN) {
    lowS = SECP256R1_N - lowS;
    recovery = recovery === 0 ? 1 : 0;
  }
  return {
    r: '0x' + sig.r.toString(16),
    s: '0x' + lowS.toString(16),
    y_parity: recovery === 1,
  };
}

/**
 * Chain-dispatching attestation signer. Each chain binds the signature over a
 * different serialisation of `(addressSeed, devicePubkey)`; the on-chain
 * `initialize` recomputes the same digest, so they must match exactly.
 */
export function signAttestationForChain(
  chain: 'starknet' | 'solana',
  addressSeedHex: string,
  pubXHex: string,
  pubYHex: string,
): { r: string; s: string; y_parity: boolean } {
  switch (chain) {
    case 'solana':
      return signDigest(attestationDigestSolana(addressSeedHex, pubXHex, pubYHex));
    case 'starknet':
    default:
      return signDigest(attestationDigest(addressSeedHex, pubXHex, pubYHex));
  }
}

/**
 * Sign the attestation digest with the Cavos attestation private key
 * (CAVOS_ATTESTATION_PRIVATE_KEY, a P-256 PKCS#8 PEM). Returns (r, s, yParity)
 * in the shape the contract's `initialize` expects.
 *
 * The signature is low-s normalised (the contract does this too, so the
 * returned values are canonical and the contract's low-s path is a no-op).
 * `y_parity` is the recovery parity after low-s normalisation — the contract's
 * `recovered_signer_id` uses it to pick the correct recovery candidate.
 */
export function signAttestation(
  addressSeedHex: string,
  pubXHex: string,
  pubYHex: string,
): { r: string; s: string; y_parity: boolean } {
  const digest = attestationDigest(addressSeedHex, pubXHex, pubYHex);
  const privKey = attestationPrivateKey();

  // p256.sign hashes the message by default; passing {lowS: true} + the raw
  // digest via sign(msgHash) means "sign this pre-computed hash". The contract
  // does recover_public_key(digest, sig) on the same digest, so this matches.
  const sig = p256.sign(digest, privKey);

  // p256.sign already returns low-s when configured, but verify explicitly.
  const halfN = SECP256R1_N / 2n;
  let lowS = sig.s;
  let recovery = sig.recovery;
  if (lowS > halfN) {
    lowS = SECP256R1_N - lowS;
    recovery = recovery === 0 ? 1 : 0;
  }

  return {
    r: '0x' + sig.r.toString(16),
    s: '0x' + lowS.toString(16),
    y_parity: recovery === 1,
  };
}

/**
 * Convert a bigint to a 32-byte big-endian buffer (matches Cairo's
 * `append_felt_be32` / the SDK's `bigIntTo32Bytes`).
 */
function bigIntTo32BytesBE(value: bigint): Buffer {
  const out = Buffer.alloc(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}
