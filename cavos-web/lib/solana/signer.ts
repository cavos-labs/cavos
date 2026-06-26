/**
 * Relayer signing — Turnkey only.
 *
 * The sponsoring relayer's fee-payer key is a real-money hot key, so it lives
 * exclusively in Turnkey's HSM-backed enclave: it is NEVER present in this
 * process or in any env var. Co-signing goes through `RelayerSigner`, which
 * exposes only the public key and a `signTransaction` operation — we send the
 * transaction's message bytes to Turnkey, get back an Ed25519 signature, and
 * attach it. A compromised process can request signatures while access lasts
 * (mitigated by Turnkey policies/rate limits) but can NEVER exfiltrate the key.
 *
 * The whitelist in `validateSponsoredTransaction` is the second safety net: the
 * relayer only ever co-signs the Cavos device-account flow, so even a fully
 * abused signer can lose at most the bounded hot float, never user funds.
 */
import { PublicKey, type Transaction } from '@solana/web3.js';
import { type SolanaNetwork } from './relayer';

export interface RelayerSigner {
  /** The fee-payer public key set on every sponsored transaction. */
  readonly publicKey: PublicKey;
  /** Co-sign `tx` as fee payer — the signature is attached in place. */
  signTransaction(tx: Transaction): Promise<void>;
}

/**
 * Turnkey-backed signer — the Ed25519 secret never leaves Turnkey. Signs the
 * compiled transaction message remotely and attaches the signature.
 *
 * Env (per cluster, falling back to the unsuffixed name):
 *   TURNKEY_API_BASE_URL          (default https://api.turnkey.com)
 *   TURNKEY_API_PUBLIC_KEY        API key public part (P-256)
 *   TURNKEY_API_PRIVATE_KEY       API key private part (P-256) — used only to
 *                                 sign API requests, NOT the Solana key
 *   TURNKEY_ORGANIZATION_ID
 *   SOLANA_RELAYER_TURNKEY_SIGN_WITH[_MAINNET|_DEVNET]   the Solana wallet
 *                                 account address / private-key id to sign with
 *
 * `@turnkey/sdk-server` and `@turnkey/solana` are lazily imported so the deps are
 * only required when Turnkey is actually selected.
 */
export class TurnkeySigner implements RelayerSigner {
  private constructor(
    readonly publicKey: PublicKey,
    /** Official @turnkey/solana signer; `addSignature` mutates the tx in place. */
    private readonly solanaSigner: { addSignature(tx: Transaction, fromAddress: string): Promise<void> },
    /** The Solana wallet-account address (base58) Turnkey signs with. */
    private readonly signWith: string,
  ) {}

  static async create(network?: SolanaNetwork): Promise<TurnkeySigner> {
    // Per-network address is canonical (separate mainnet real-money key from the
    // devnet test key); the unsuffixed var is a single-key fallback.
    const perNetworkVar =
      network === 'solana-mainnet' ? 'SOLANA_RELAYER_TURNKEY_SIGN_WITH_MAINNET' :
      network === 'solana-devnet' ? 'SOLANA_RELAYER_TURNKEY_SIGN_WITH_DEVNET' :
      undefined;
    const signWith =
      (perNetworkVar && process.env[perNetworkVar]) ||
      process.env.SOLANA_RELAYER_TURNKEY_SIGN_WITH;
    const organizationId = process.env.TURNKEY_ORGANIZATION_ID;
    const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
    const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
    if (!signWith) {
      throw new Error(
        `Turnkey: no Solana address configured for ${network ?? 'default'} — set ` +
          `${perNetworkVar ?? 'SOLANA_RELAYER_TURNKEY_SIGN_WITH'} (or SOLANA_RELAYER_TURNKEY_SIGN_WITH).`,
      );
    }
    if (!organizationId || !apiPublicKey || !apiPrivateKey) {
      throw new Error('Turnkey: missing TURNKEY_ORGANIZATION_ID / TURNKEY_API_PUBLIC_KEY / TURNKEY_API_PRIVATE_KEY');
    }

    // Lazy import so Turnkey is only loaded when actually selected (keeps the
    // local-keypair path free of the dep at runtime).
    const { Turnkey } = await import('@turnkey/sdk-server');
    const { TurnkeySigner: SolanaSigner } = await import('@turnkey/solana');

    const sdk = new Turnkey({
      apiBaseUrl: process.env.TURNKEY_API_BASE_URL ?? 'https://api.turnkey.com',
      apiPublicKey,
      apiPrivateKey,
      defaultOrganizationId: organizationId,
    });

    // `signWith` is the Solana wallet-account address; its Ed25519 public key IS
    // the on-chain fee-payer pubkey, so we can set the fee payer from it directly.
    const solanaSigner = new SolanaSigner({ organizationId, client: sdk.apiClient() });
    return new TurnkeySigner(new PublicKey(signWith), solanaSigner, signWith);
  }

  async signTransaction(tx: Transaction): Promise<void> {
    // @turnkey/solana sends the tx message to Turnkey (key never leaves the HSM),
    // gets the Ed25519 signature back, and attaches it under `signWith` in place.
    await this.solanaSigner.addSignature(tx, this.signWith);
  }
}

/** Resolve the relayer signer for a network (Turnkey, HSM-held key). */
export async function getRelayerSigner(network?: SolanaNetwork): Promise<RelayerSigner> {
  return TurnkeySigner.create(network);
}
