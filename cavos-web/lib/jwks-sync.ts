/**
 * JWKS Trustless Sync Service
 *
 * Permissionless synchronization of Google, Apple, and Firebase RSA public keys with the
 * on-chain JWKS Registry via Reclaim Protocol proofs. No admin key required.
 *
 * Flow per key:
 *   1. Check if the key is already valid on-chain → skip if so.
 *   2. Generate a Reclaim zkFetch proof for the provider's JWKS endpoint.
 *      The proof cryptographically attests that `kid` and `n` were fetched over TLS
 *      from the declared URL.
 *   3. Compute the JWKSKey (n limbs + Montgomery constants).
 *   4. Call JWKSRegistryTrustless.register_key(proof, kid, key).
 *      Any account with enough ETH for gas can submit — no admin privileges needed.
 *
 * Setup:
 *   - Create Reclaim providers at https://dev.reclaimprotocol.org for each JWKS URL
 *     (see RECLAIM_PROVIDER_* env vars below).
 *   - Deploy JWKSRegistryTrustless and transfer JWKS registry admin to it.
 *   - Fill in JWKS_TRUSTLESS_REGISTRY_* addresses.
 *
 * Uses starknet.js v9 Account.execute() for native V3 transaction support.
 */

import { Account, RpcProvider, Contract } from 'starknet';

// ── Provider JWKS endpoints ──────────────────────────────────────────────────
const GOOGLE_JWKS_URL   = 'https://www.googleapis.com/oauth2/v3/certs';
const APPLE_JWKS_URL    = 'https://appleid.apple.com/auth/keys';
const CAVOS_FIREBASE_JWKS_URL = 'https://cavos.xyz/.well-known/jwks.json';

// Provider label felt252 values (big-endian UTF-8 encoding of the label string).
const PROVIDER_GOOGLE   = '0x676f6f676c65';   // 'google'
const PROVIDER_APPLE    = '0x6170706c65';     // 'apple'
const PROVIDER_FIREBASE = '0x6669726562617365'; // 'firebase'

// Reclaim application credentials (from https://dev.reclaimprotocol.org)
const RECLAIM_APP_ID = process.env['RECLAIM_APP_ID'] ?? '';
const RECLAIM_APP_SECRET = process.env['RECLAIM_APP_SECRET'] ?? '';

// ── ABI (minimal — only entries used by this service) ───────────────────────

// Minimal ABI for JWKSRegistry (read-only — used for is_key_valid checks).
const JWKS_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'is_key_valid',
    inputs: [{ name: 'kid', type: 'core::felt252' }],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'view',
  },
] as const;

// ── Network Configuration ────────────────────────────────────────────────────

interface NetworkConfig {
  rpcUrl: string;
  /** Address of the original JWKSRegistry (for is_key_valid read calls). */
  registryAddress: string;
  /** Address of the new JWKSRegistryTrustless contract. */
  trustlessRegistryAddress: string;
  /** Address of the account used to submit transactions (pays gas, not admin). */
  submitterAddress: string;
  /** Private key of the gas-paying submitter account. */
  submitterPrivateKey: string;
}

interface SyncResult {
  added: string[];
  skipped: string[];
  errors: string[];
}

function getNetworkConfig(network: 'sepolia' | 'mainnet'): NetworkConfig {
  const suffix = network === 'sepolia' ? 'SEPOLIA' : 'MAINNET';
  return {
    rpcUrl:
      process.env[`STARKNET_RPC_${suffix}`] ||
      (network === 'sepolia'
        ? 'https://free-rpc.nethermind.io/sepolia-juno/v0_7'
        : 'https://free-rpc.nethermind.io/mainnet-juno/v0_7'),
    registryAddress: process.env[`JWKS_REGISTRY_${suffix}`]!,
    trustlessRegistryAddress: process.env[`JWKS_TRUSTLESS_REGISTRY_${suffix}`]!,
    submitterAddress: process.env[`JWKS_SUBMITTER_ADDRESS_${suffix}`]!,
    submitterPrivateKey: process.env[`JWKS_SUBMITTER_PRIVATE_KEY_${suffix}`]!,
  };
}

// ── JWKS Fetch & Key Processing ──────────────────────────────────────────────

interface JWK {
  kid: string;
  kty: string;
  alg: string;
  n: string;
  e: string;
  use?: string;
}

interface FormattedKey {
  kid: string;
  kidFelt: string;
  nLimbs: bigint[];
  rSqLimbs: bigint[];
  nPrimeLimbs: bigint[];
  provider: string;
  /** Raw base64url modulus string from the JWKS JSON (needed for Reclaim proof params). */
  nBase64url: string;
  validUntil: number;
}

/**
 * Convert a key ID string to felt252 (max 31 bytes, big-endian UTF-8).
 */
function kidToFelt(kid: string): string {
  const bytes = Buffer.from(kid, 'utf8');
  let felt = 0n;
  for (let i = 0; i < Math.min(bytes.length, 31); i++) {
    felt = felt * 256n + BigInt(bytes[i]);
  }
  return '0x' + felt.toString(16);
}

/**
 * Decode a base64url RSA modulus into 16 × 128-bit limbs (little-endian).
 * limbs[0] = n0 = least significant 128-bit chunk.
 */
function modulusToLimbs(base64url: string): bigint[] {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');

  const bytes = Buffer.from(base64, 'base64');

  // Pad to 256 bytes (2048-bit RSA).
  const padded = Buffer.alloc(256);
  bytes.copy(padded, 256 - bytes.length);

  // Little-endian: limbs[0] = LSB chunk (padded[240..255]), limbs[15] = MSB chunk.
  const limbs: bigint[] = [];
  for (let i = 15; i >= 0; i--) {
    let value = 0n;
    for (let j = 0; j < 16; j++) {
      value = value * 256n + BigInt(padded[i * 16 + j]);
    }
    limbs.push(value);
  }
  return limbs;
}

/**
 * Compute R^2 and n_prime for Montgomery reduction.
 */
function calculateMontgomeryConstants(n_limbs: bigint[]): { n_prime: bigint[]; r_sq: bigint[] } {
  let n = 0n;
  for (let i = 0; i < n_limbs.length; i++) {
    n += n_limbs[i] * (1n << (BigInt(i) * 128n));
  }

  const R = 1n << 2048n;

  function modInverse(n: bigint, mod: bigint): bigint {
    let t = 0n;
    let newt = 1n;
    let r = mod;
    let newr = n;

    while (newr !== 0n) {
      const quotient = r / newr;
      [t, newt] = [newt, t - quotient * newt];
      [r, newr] = [newr, r - quotient * newr];
    }

    if (r > 1n) throw new Error('n is not invertible');
    if (t < 0n) t = t + mod;
    return t;
  }

  const n_inv = modInverse(n, R);
  const n_prime_val = (R - n_inv) % R;
  const r_sq_val = (R * R) % n;

  const toLimbs = (val: bigint): bigint[] => {
    const limbs: bigint[] = [];
    for (let i = 0; i < 16; i++) {
      limbs.push((val >> (BigInt(i) * 128n)) & ((1n << 128n) - 1n));
    }
    return limbs;
  };

  return {
    n_prime: toLimbs(n_prime_val),
    r_sq: toLimbs(r_sq_val),
  };
}

/**
 * Fetch and format JWKS keys from a single provider.
 */
async function fetchProviderKeys(
  provider: 'google' | 'apple' | 'firebase',
  jwksUrl: string,
  providerFelt: string,
): Promise<FormattedKey[]> {
  const url = jwksUrl;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${provider} JWKS`);
  const data: { keys: JWK[] } = await res.json();

  // Valid for ~30 days from now.
  const validUntil = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  return data.keys
    .filter((k) => k.kty === 'RSA' && k.alg === 'RS256')
    .map((k) => {
      const nLimbs = modulusToLimbs(k.n);
      const mont = calculateMontgomeryConstants(nLimbs);
      return {
        kid: k.kid,
        kidFelt: kidToFelt(k.kid),
        nLimbs,
        rSqLimbs: mont.r_sq,
        nPrimeLimbs: mont.n_prime,
        provider: providerFelt,
        nBase64url: k.n,
        validUntil,
      };
    });
}

/**
 * Check whether a key already exists and is valid on-chain.
 */
async function isKeyValidOnChain(contract: Contract, kidFelt: string): Promise<boolean> {
  try {
    const result = await contract.is_key_valid(kidFelt);
    return Boolean(result);
  } catch {
    return false;
  }
}

// ── Reclaim Proof Generation ─────────────────────────────────────────────────

/**
 * Reclaim proof structure (matches the Cairo on-chain struct for calldata encoding).
 */
interface ReclaimProof {
  id: string;
  claimInfo: {
    provider: string;
    parameters: string;
    context: string;
  };
  signedClaim: {
    claim: {
      identifier: string;
      byteIdentifier: string;
      owner: string;
      epoch: string;
      timestampS: string;
    };
    signatures: Array<{ r: string; s: string; v: number }>;
  };
}

/**
 * Generate a Reclaim zkFetch proof for a JWKS endpoint.
 *
 * When targetKid and targetN are provided the proof uses exact-value regexes so
 * that each kid gets its own independent, consistent proof (kid ↔ n pairing is
 * guaranteed).  Without them the generic regex is used, which only proves the
 * first occurrence of each field.
 */
async function generateReclaimProof(
  jwksUrl: string,
  targetKid?: string,
  targetN?: string,
): Promise<ReclaimProof> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ReclaimClient } = require('@reclaimprotocol/zk-fetch');

  const client = new ReclaimClient(RECLAIM_APP_ID, RECLAIM_APP_SECRET);

  // Use exact-value regexes when the caller specifies which key to prove.
  // base64url and hex characters are regex-safe (no special chars to escape).
  const kidRegex = targetKid
    ? `"kid":\\s*"(?<kid>${targetKid})"`
    : `"kid":\\s*"(?<kid>[^"]+)"`;
  const nRegex = targetN
    ? `"n":\\s*"(?<n>${targetN})"`
    : `"n":\\s*"(?<n>[^"]+)"`;

  const rawProof = await client.zkFetch(
    jwksUrl,
    { method: 'GET' },
    {
      responseMatches: [
        { type: 'regex', value: kidRegex },
        { type: 'regex', value: nRegex },
      ],
    },
  );

  if (!rawProof) throw new Error(`zkFetch returned null for ${jwksUrl}`);

  // zkFetch proof shape (confirmed from live proofs):
  //   rawProof.claimData.{ provider, parameters, context, owner, timestampS, identifier, epoch }
  //   rawProof.identifier  (256-bit hex)
  //   rawProof.signatures  (array of raw 65-byte hex strings)
  const claimData = rawProof.claimData ?? {};
  const identifierHex: string = claimData.identifier ?? rawProof.identifier ?? '0x0';

  return {
    id: '0x0', // felt252 placeholder — identifier is 256-bit, unused by contract
    claimInfo: {
      provider: claimData.provider ?? 'http',
      parameters: claimData.parameters ?? '',
      context: claimData.context ?? '',
    },
    signedClaim: {
      claim: {
        identifier: identifierHex,
        byteIdentifier: identifierHex,
        owner: claimData.owner ?? '',
        epoch: String(claimData.epoch ?? '1'),
        timestampS: String(claimData.timestampS ?? '0'),
      },
      signatures: (rawProof.signatures ?? []).map((sig: string) => {
        const hex = sig.startsWith('0x') ? sig.slice(2) : sig;
        return { r: hex.slice(0, 64), s: hex.slice(64, 128), v: parseInt(hex.slice(128, 130), 16) };
      }),
    },
  };
}

/**
 * Encode a UTF-8 string as Cairo ByteArray felts.
 * Format: [num_full_words, word0..wordN, pending_word, pending_word_len]
 * Strings starting with "0x" are passed as hex numbers by CallData.compile,
 * causing felt overflow — this manual encoding avoids that issue.
 */
function encodeByteArray(str: string): string[] {
  const bytes = Buffer.from(str, 'utf8');
  const result: string[] = [];
  const fullWords = Math.floor(bytes.length / 31);
  result.push('0x' + fullWords.toString(16));
  for (let i = 0; i < fullWords; i++) {
    let word = 0n;
    for (let j = 0; j < 31; j++) word = word * 256n + BigInt(bytes[i * 31 + j]);
    result.push('0x' + word.toString(16));
  }
  const remaining = bytes.length % 31;
  let pending = 0n;
  for (let j = 0; j < remaining; j++) pending = pending * 256n + BigInt(bytes[fullWords * 31 + j]);
  result.push('0x' + pending.toString(16));
  result.push('0x' + remaining.toString(16));
  return result;
}

function hexToU256(hexStr: string): { low: string; high: string } {
  const hex = (hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr).padStart(64, '0');
  return { low: '0x' + hex.slice(32), high: '0x' + hex.slice(0, 32) };
}

/**
 * Build the flat felt252 calldata array for register_key(proof, kid, key).
 * Uses manual ByteArray encoding to avoid starknet.js type-inference issues
 * with hex strings > felt252 max (e.g. the 256-bit identifier).
 */
function buildRegisterKeyCalldata(proof: ReclaimProof, key: FormattedKey): string[] {
  const h = (v: bigint) => '0x' + v.toString(16);
  const idU256 = hexToU256(proof.signedClaim.claim.identifier);

  return [
    // ── Proof ────────────────────────────────────────────────────────────────
    proof.id,                                                   // id: felt252
    ...encodeByteArray(proof.claimInfo.provider),               // claim_info.provider
    ...encodeByteArray(proof.claimInfo.parameters),             // claim_info.parameters
    ...encodeByteArray(proof.claimInfo.context),                // claim_info.context
    idU256.low, idU256.high,                                    // identifier: u256
    ...encodeByteArray(proof.signedClaim.claim.byteIdentifier), // byte_identifier: ByteArray
    ...encodeByteArray(proof.signedClaim.claim.owner),          // owner: ByteArray
    ...encodeByteArray(proof.signedClaim.claim.epoch),          // epoch: ByteArray
    ...encodeByteArray(proof.signedClaim.claim.timestampS),     // timestamp_s: ByteArray
    '0x' + proof.signedClaim.signatures.length.toString(16),   // signatures array length
    ...proof.signedClaim.signatures.flatMap((sig) => {         // r_low, r_high, s_low, s_high, v
      const r = hexToU256('0x' + sig.r);
      const s = hexToU256('0x' + sig.s);
      return [r.low, r.high, s.low, s.high, '0x' + sig.v.toString(16)];
    }),
    // ── kid ──────────────────────────────────────────────────────────────────
    key.kidFelt,
    // ── JWKSKey ──────────────────────────────────────────────────────────────
    ...key.nLimbs.map(h),
    ...key.rSqLimbs.map(h),
    ...key.nPrimeLimbs.map(h),
    key.provider,
    h(BigInt(key.validUntil)),
    '0x1', // is_active: true
  ];
}

// ── Sync Logic ───────────────────────────────────────────────────────────────

/** Describes one provider to sync. */
interface ProviderConfig {
  name: 'google' | 'apple' | 'firebase';
  jwksUrl: string;
  providerFelt: string;
}

export async function syncJWKS(network: 'sepolia' | 'mainnet'): Promise<SyncResult> {
  const config = getNetworkConfig(network);
  const results: SyncResult = { added: [], skipped: [], errors: [] };

  if (!config.registryAddress || !config.trustlessRegistryAddress) {
    throw new Error(`Missing ${network} registry addresses. Check environment variables.`);
  }
  if (!config.submitterAddress || !config.submitterPrivateKey) {
    throw new Error(`Missing ${network} submitter account. Check environment variables.`);
  }

  console.log(`[${network}] Starting trustless JWKS sync...`);
  console.log(`[${network}] JWKS Registry:            ${config.registryAddress}`);
  console.log(`[${network}] Trustless Registry:       ${config.trustlessRegistryAddress}`);
  console.log(`[${network}] Gas submitter:            ${config.submitterAddress}`);

  const provider = new RpcProvider({ nodeUrl: config.rpcUrl });
  const account = new Account({
    provider: { nodeUrl: config.rpcUrl },
    address: config.submitterAddress,
    signer: config.submitterPrivateKey,
  });

  // Read-only contract for is_key_valid checks (uses the original registry).
  const readContract = new Contract({
    abi: JWKS_REGISTRY_ABI as any,
    address: config.registryAddress,
    providerOrAccount: provider,
  });

  // Firebase (Cavos) is now trustless: served at /.well-known/jwks.json,
  // verified by Argus via CAVOS_FIREBASE_JWKS_URL_HASH — same flow as Google/Apple.
  const providers: ProviderConfig[] = [
    { name: 'google',   jwksUrl: GOOGLE_JWKS_URL,         providerFelt: PROVIDER_GOOGLE   },
    { name: 'apple',    jwksUrl: APPLE_JWKS_URL,           providerFelt: PROVIDER_APPLE    },
    { name: 'firebase', jwksUrl: CAVOS_FIREBASE_JWKS_URL,  providerFelt: PROVIDER_FIREBASE },
  ];

  for (const providerCfg of providers) {
    let keys: FormattedKey[] = [];

    try {
      keys = await fetchProviderKeys(providerCfg.name, providerCfg.jwksUrl, providerCfg.providerFelt);
      console.log(`[${network}] Fetched ${keys.length} ${providerCfg.name} keys`);
    } catch (error: any) {
      results.errors.push(`Failed to fetch ${providerCfg.name} keys: ${error.message}`);
      console.error(`[${network}] ${providerCfg.name} fetch error:`, error.message);
      continue;
    }

    // First, skip all keys that are already on-chain.
    const needsRegistration = (
      await Promise.all(keys.map(async (key) => {
        const isValid = await isKeyValidOnChain(readContract, key.kidFelt);
        if (isValid) {
          results.skipped.push(key.kid);
          console.log(`[${network}] Key already on-chain: ${key.kid}`);
          return null;
        }
        return key;
      }))
    ).filter((k): k is FormattedKey => k !== null);

    if (needsRegistration.length === 0) continue;

    // Generate a targeted Reclaim proof per kid so every unregistered key gets
    // its own proof with exact-match regexes (kid ↔ n pairing is guaranteed).
    for (const key of needsRegistration) {
      try {
        console.log(`[${network}] Generating Reclaim proof for ${providerCfg.name} kid=${key.kid}...`);
        const proof = await generateReclaimProof(providerCfg.jwksUrl, key.kid, key.nBase64url);

        console.log(`[${network}] Submitting register_key for ${key.kid}`);
        const calldata = buildRegisterKeyCalldata(proof, key);

        const { transaction_hash } = await account.execute({
          contractAddress: config.trustlessRegistryAddress,
          entrypoint: 'register_key',
          calldata,
        });

        console.log(`[${network}] Transaction submitted: ${transaction_hash}`);
        await provider.waitForTransaction(transaction_hash);
        console.log(`[${network}] Transaction confirmed: ${transaction_hash}`);

        results.added.push(key.kid);
      } catch (error: any) {
        const errorMsg = `Failed to register ${providerCfg.name} key ${key.kid}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[${network}] ${errorMsg}`);
      }
    }
  }

  console.log(
    `[${network}] Sync complete. Added: ${results.added.length}, ` +
      `Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`,
  );
  return results;
}

/**
 * Sync JWKS for both networks.
 */
export async function syncAllNetworks(): Promise<{
  sepolia: SyncResult;
  mainnet: SyncResult;
}> {
  const results = {
    sepolia: { added: [], skipped: [], errors: [] } as SyncResult,
    mainnet: { added: [], skipped: [], errors: [] } as SyncResult,
  };

  try {
    results.sepolia = await syncJWKS('sepolia');
  } catch (error: any) {
    results.sepolia.errors.push(`Sepolia sync failed: ${error.message}`);
    console.error('Sepolia sync failed:', error);
  }

  try {
    results.mainnet = await syncJWKS('mainnet');
  } catch (error: any) {
    results.mainnet.errors.push(`Mainnet sync failed: ${error.message}`);
    console.error('Mainnet sync failed:', error);
  }

  return results;
}
