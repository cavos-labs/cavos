/**
 * Relayer signing — local Ed25519.
 *
 * The sponsoring relayer's fee-payer key is a single operational hot key Cavos
 * controls (not per-user custody), so it is signed in-process: the secret is
 * loaded once from the environment (injected by a Secret Manager / Vault).
 * Co-signing goes through `RelayerSigner`, which exposes only the public key and
 * a `signTransaction` operation.
 *
 * The whitelist in `validateSponsoredTransaction` is the safety net: the relayer
 * only ever co-signs the Cavos device-account flow, so even a fully abused
 * signer can lose at most the bounded hot float, never user funds.
 */
import { Keypair, PublicKey, type Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { type SolanaNetwork } from './relayer';

export interface RelayerSigner {
  /** The fee-payer public key set on every sponsored transaction. */
  readonly publicKey: PublicKey;
  /** Co-sign `tx` as fee payer — the signature is attached in place. */
  signTransaction(tx: Transaction): Promise<void>;
}

/**
 * Local Ed25519 signer — the fee-payer key lives in the process, loaded once at
 * construction from a secret the runtime injects (Secret Manager / Vault → env).
 *
 * The relay signer is a single operational wallet Cavos controls (not per-user
 * custody), so in-process signing is safe and costs nothing per signature. The
 * whitelist in `validateSponsoredTransaction` bounds the blast radius to the hot
 * float, never user funds.
 *
 * Env (per cluster, falling back to the unsuffixed name):
 *   SOLANA_RELAYER_SECRET_KEY[_MAINNET|_DEVNET]
 *     the fee-payer secret, accepted as any of:
 *       - a JSON array of 64 bytes (solana-keygen output)
 *       - base58 of the 64-byte secret key
 *       - base58 of the 32-byte seed
 */
export class LocalSigner implements RelayerSigner {
  readonly publicKey: PublicKey;

  private constructor(private readonly keypair: Keypair) {
    this.publicKey = keypair.publicKey;
  }

  static fromEnv(network?: SolanaNetwork): LocalSigner | undefined {
    const perNetworkVar =
      network === 'solana-mainnet' ? 'SOLANA_RELAYER_SECRET_KEY_MAINNET' :
      network === 'solana-devnet' ? 'SOLANA_RELAYER_SECRET_KEY_DEVNET' :
      undefined;
    const raw =
      (perNetworkVar && process.env[perNetworkVar]) ||
      process.env.SOLANA_RELAYER_SECRET_KEY;
    if (!raw) return undefined;
    return new LocalSigner(LocalSigner.parseKeypair(raw.trim()));
  }

  /** Parse a JSON byte array, base58 64-byte secret, or base58 32-byte seed. */
  private static parseKeypair(raw: string): Keypair {
    if (raw.startsWith('[')) {
      const bytes = Uint8Array.from(JSON.parse(raw) as number[]);
      return Keypair.fromSecretKey(bytes);
    }
    const decoded = bs58.decode(raw);
    if (decoded.length === 64) return Keypair.fromSecretKey(decoded);
    if (decoded.length === 32) return Keypair.fromSeed(decoded);
    throw new Error(
      `Solana relayer secret has ${decoded.length} bytes; expected 32 (seed) or 64 (secret key).`,
    );
  }

  async signTransaction(tx: Transaction): Promise<void> {
    // Attach the fee-payer signature in place. partialSign only adds this key's
    // signature, leaving any others intact.
    tx.partialSign(this.keypair);
  }
}

/** Resolve the relayer signer for a network (local Ed25519, secret from env). */
export async function getRelayerSigner(network?: SolanaNetwork): Promise<RelayerSigner> {
  const local = LocalSigner.fromEnv(network);
  if (local) return local;
  throw new Error(
    `No Solana relayer secret configured for ${network ?? 'default'} — set ` +
      'SOLANA_RELAYER_SECRET_KEY_MAINNET / _DEVNET (or SOLANA_RELAYER_SECRET_KEY).',
  );
}
