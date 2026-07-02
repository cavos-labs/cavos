/**
 * Relayer signing — local Ed25519.
 *
 * The sponsoring relayer's source/fee-payer key is a single operational hot key
 * Cavos controls (not per-user custody), so it is signed in-process: the secret
 * is loaded once from the environment (injected by a Secret Manager / Vault).
 * Signing goes through `StellarRelayerSigner`, which exposes only the public
 * G-address and a `signTransaction` operation.
 *
 * The whitelist in `validateSponsoredTransaction` is the safety net: the relayer
 * only ever signs the Cavos device-account flow, so even a fully abused signer
 * can lose at most the bounded hot float, never user funds. Mirrors the Solana
 * relayer signer — see lib/solana/signer.ts.
 */
import { Keypair, type Transaction } from '@stellar/stellar-sdk';
import { type StellarNetwork } from './relayer';

export interface StellarRelayerSigner {
  /** The relayer public G-address set as the source/fee payer on every tx. */
  publicKey(): string;
  /** Sign `tx` as source/fee payer — the signature is attached in place. */
  signTransaction(tx: Transaction): Promise<void>;
}

/**
 * Local Ed25519 signer — the source/fee-payer key lives in the process, loaded
 * once from a secret the runtime injects (Secret Manager / Vault → env).
 *
 * The relay signer is a single operational wallet Cavos controls (not per-user
 * custody), so in-process signing is safe and costs nothing per signature. The
 * whitelist in `validateSponsoredTransaction` bounds the blast radius.
 *
 * Env (per network, falling back to the unsuffixed name):
 *   STELLAR_RELAYER_SECRET[_MAINNET|_TESTNET]   the S... StrKey secret seed;
 *                                 its G-address IS the on-chain source.
 */
export class LocalStellarSigner implements StellarRelayerSigner {
  private constructor(private readonly keypair: Keypair) {}

  publicKey(): string {
    return this.keypair.publicKey();
  }

  static fromEnv(network?: StellarNetwork): LocalStellarSigner | undefined {
    const perNetworkVar =
      network === 'stellar-mainnet' ? 'STELLAR_RELAYER_SECRET_MAINNET' :
      network === 'stellar-testnet' ? 'STELLAR_RELAYER_SECRET_TESTNET' :
      undefined;
    const secret =
      (perNetworkVar && process.env[perNetworkVar]) ||
      process.env.STELLAR_RELAYER_SECRET;
    if (!secret) return undefined;
    return new LocalStellarSigner(Keypair.fromSecret(secret.trim()));
  }

  async signTransaction(tx: Transaction): Promise<void> {
    // Attach the source/fee-payer DecoratedSignature in place (device auth
    // inside the tx is untouched).
    tx.sign(this.keypair);
  }
}

/** Resolve the relayer signer for a network (local Ed25519, secret from env). */
export async function getRelayerSigner(network?: StellarNetwork): Promise<StellarRelayerSigner> {
  const local = LocalStellarSigner.fromEnv(network);
  if (local) return local;
  throw new Error(
    `No Stellar relayer secret configured for ${network ?? 'default'} — set ` +
      'STELLAR_RELAYER_SECRET_MAINNET / _TESTNET (or STELLAR_RELAYER_SECRET).',
  );
}
