/**
 * Relayer signing — Turnkey only.
 *
 * The sponsoring relayer's source/fee-payer key is a real-money hot key, so it
 * lives exclusively in Turnkey's HSM-backed enclave: it is NEVER present in this
 * process or in any env var. Signing goes through `StellarRelayerSigner`, which
 * exposes only the public G-address and a `signTransaction` operation — we send
 * the transaction hash to Turnkey, get back an Ed25519 signature, and attach it
 * as a DecoratedSignature. A compromised process can request signatures while
 * access lasts (mitigated by Turnkey policies/rate limits) but can NEVER
 * exfiltrate the key.
 *
 * The whitelist in `validateSponsoredTransaction` is the second safety net: the
 * relayer only ever signs the Cavos device-account flow, so even a fully abused
 * signer can lose at most the bounded hot float, never user funds. Mirrors the
 * Solana relayer signer — see lib/solana/signer.ts.
 */
import { Keypair, xdr, type Transaction } from '@stellar/stellar-sdk';
import { type StellarNetwork } from './relayer';

export interface StellarRelayerSigner {
  /** The relayer public G-address set as the source/fee payer on every tx. */
  publicKey(): string;
  /** Sign `tx` as source/fee payer — the signature is attached in place. */
  signTransaction(tx: Transaction): Promise<void>;
}

/** Turnkey signRawPayload response for an Ed25519 key (signature = r || s). */
interface RawPayloadResult { r: string; s: string; v?: string }
interface RawSigner {
  signRawPayload(input: {
    signWith: string;
    payload: string;
    encoding: 'PAYLOAD_ENCODING_HEXADECIMAL';
    hashFunction: 'HASH_FUNCTION_NOT_APPLICABLE';
  }): Promise<RawPayloadResult>;
}

/**
 * Turnkey-backed signer — the Ed25519 secret never leaves Turnkey. Signs the
 * transaction hash remotely and attaches a DecoratedSignature.
 *
 * Env (per network, falling back to the unsuffixed name):
 *   TURNKEY_API_BASE_URL          (default https://api.turnkey.com)
 *   TURNKEY_API_PUBLIC_KEY        API key public part (P-256)
 *   TURNKEY_API_PRIVATE_KEY       API key private part (P-256) — used only to
 *                                 sign API requests, NOT the Stellar key
 *   TURNKEY_ORGANIZATION_ID
 *   STELLAR_RELAYER_TURNKEY_SIGN_WITH[_MAINNET|_TESTNET]   the Turnkey Stellar
 *                                 wallet-account G-address to sign with (its
 *                                 Ed25519 public key IS the on-chain source).
 *
 * `@turnkey/sdk-server` is lazily imported so the dep is only required when the
 * signer is actually created.
 */
export class TurnkeyStellarSigner implements StellarRelayerSigner {
  private constructor(
    /** The relayer G-address (source/fee payer + the key Turnkey signs with). */
    private readonly gAddress: string,
    private readonly client: RawSigner,
  ) {}

  publicKey(): string {
    return this.gAddress;
  }

  static async create(network?: StellarNetwork): Promise<TurnkeyStellarSigner> {
    // Per-network address is canonical (separate the mainnet real-money key from
    // the testnet test key); the unsuffixed var is a single-key fallback.
    const perNetworkVar =
      network === 'stellar-mainnet' ? 'STELLAR_RELAYER_TURNKEY_SIGN_WITH_MAINNET' :
      network === 'stellar-testnet' ? 'STELLAR_RELAYER_TURNKEY_SIGN_WITH_TESTNET' :
      undefined;
    const signWith =
      (perNetworkVar && process.env[perNetworkVar]) ||
      process.env.STELLAR_RELAYER_TURNKEY_SIGN_WITH;
    const organizationId = process.env.TURNKEY_ORGANIZATION_ID;
    const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
    const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
    if (!signWith) {
      throw new Error(
        `Turnkey: no Stellar address configured for ${network ?? 'default'} — set ` +
          `${perNetworkVar ?? 'STELLAR_RELAYER_TURNKEY_SIGN_WITH'} (or STELLAR_RELAYER_TURNKEY_SIGN_WITH).`,
      );
    }
    if (!organizationId || !apiPublicKey || !apiPrivateKey) {
      throw new Error('Turnkey: missing TURNKEY_ORGANIZATION_ID / TURNKEY_API_PUBLIC_KEY / TURNKEY_API_PRIVATE_KEY');
    }

    // `@turnkey/sdk-server` uses tsyringe (DI), which needs the reflect-metadata
    // polyfill loaded BEFORE the SDK module is evaluated. Import it first.
    await import('reflect-metadata');
    const { Turnkey } = await import('@turnkey/sdk-server');

    const sdk = new Turnkey({
      apiBaseUrl: process.env.TURNKEY_API_BASE_URL ?? 'https://api.turnkey.com',
      apiPublicKey,
      apiPrivateKey,
      defaultOrganizationId: organizationId,
    });

    return new TurnkeyStellarSigner(signWith, sdk.apiClient() as unknown as RawSigner);
  }

  async signTransaction(tx: Transaction): Promise<void> {
    // Send the 32-byte tx hash to Turnkey (key never leaves the HSM). EdDSA can't
    // sign a pre-computed digest, so we pass the hash as the raw payload with no
    // extra hashing — this matches how Stellar signs (Ed25519 over the tx hash).
    const payload = tx.hash().toString('hex');
    const { r, s } = await this.client.signRawPayload({
      signWith: this.gAddress,
      payload,
      encoding: 'PAYLOAD_ENCODING_HEXADECIMAL',
      hashFunction: 'HASH_FUNCTION_NOT_APPLICABLE',
    });
    const signature = Buffer.from(`${r}${s}`, 'hex'); // Ed25519 sig = r || s (64 bytes)
    const hint = Keypair.fromPublicKey(this.gAddress).signatureHint();
    tx.addDecoratedSignature(new xdr.DecoratedSignature({ hint, signature }));
  }
}

/** Resolve the relayer signer for a network (Turnkey, HSM-held key). */
export async function getRelayerSigner(network?: StellarNetwork): Promise<StellarRelayerSigner> {
  return TurnkeyStellarSigner.create(network);
}
