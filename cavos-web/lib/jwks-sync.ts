/**
 * JWKS Auto-Sync Service
 *
 * Synchronizes Google and Apple RSA public keys with the on-chain JWKS Registry.
 * Uses starknet.js v9 Account.execute() for native V3 transaction support.
 */

import { Account, RpcProvider, Contract } from 'starknet';

// ── Provider JWKS endpoints ─────────────────────────────────────────────────
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

// Provider identifiers as felt252
const PROVIDER_GOOGLE = '0x676f6f676c65'; // 'google'
const PROVIDER_APPLE = '0x6170706c65';    // 'apple'

// ── ABI (minimal – only entries used by this service) ───────────────────────
const JWKS_REGISTRY_ABI = [
  {
    type: 'struct',
    name: 'JWKSKey',
    members: [
      { name: 'n0', type: 'core::integer::u128' },
      { name: 'n1', type: 'core::integer::u128' },
      { name: 'n2', type: 'core::integer::u128' },
      { name: 'n3', type: 'core::integer::u128' },
      { name: 'n4', type: 'core::integer::u128' },
      { name: 'n5', type: 'core::integer::u128' },
      { name: 'n6', type: 'core::integer::u128' },
      { name: 'n7', type: 'core::integer::u128' },
      { name: 'n8', type: 'core::integer::u128' },
      { name: 'n9', type: 'core::integer::u128' },
      { name: 'n10', type: 'core::integer::u128' },
      { name: 'n11', type: 'core::integer::u128' },
      { name: 'n12', type: 'core::integer::u128' },
      { name: 'n13', type: 'core::integer::u128' },
      { name: 'n14', type: 'core::integer::u128' },
      { name: 'n15', type: 'core::integer::u128' },
      { name: 'provider', type: 'core::felt252' },
      { name: 'valid_until', type: 'core::integer::u64' },
      { name: 'is_active', type: 'core::bool' },
    ],
  },
  {
    type: 'function',
    name: 'set_key',
    inputs: [
      { name: 'kid', type: 'core::felt252' },
      { name: 'key', type: 'JWKSKey' },
    ],
    outputs: [],
    state_mutability: 'external',
  },
  {
    type: 'function',
    name: 'is_key_valid',
    inputs: [{ name: 'kid', type: 'core::felt252' }],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'view',
  },
] as const;

// ── Network Configuration ───────────────────────────────────────────────────

interface NetworkConfig {
  rpcUrl: string;
  registryAddress: string;
  adminAddress: string;
  adminPrivateKey: string;
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
    adminAddress: process.env[`JWKS_ADMIN_ADDRESS_${suffix}`]!,
    adminPrivateKey: process.env[`JWKS_ADMIN_PRIVATE_KEY_${suffix}`]!,
  };
}

// ── JWKS Fetch & Key Processing ─────────────────────────────────────────────

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
  provider: string;
  validUntil: number;
}

/**
 * Convert a key ID string to felt252 (max 31 bytes).
 * Matches the format used by the populate scripts.
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
 * Decode a base64url RSA modulus into 16 × 128-bit limbs.
 *
 * LITTLE-ENDIAN: limbs[0] = n0 = least significant 128-bit chunk.
 * This matches the contract's JWKSKey struct and the working populate scripts.
 */
function modulusToLimbs(base64url: string): bigint[] {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');

  const bytes = Buffer.from(base64, 'base64');

  // Pad to 256 bytes (2048-bit RSA)
  const padded = Buffer.alloc(256);
  bytes.copy(padded, 256 - bytes.length);

  // Little-endian: iterate from the END of the byte array first (= least significant)
  // to produce limbs[0] = LSB limb, limbs[15] = MSB limb.
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
 * Fetch & format JWKS keys from a single provider.
 */
async function fetchProviderKeys(provider: 'google' | 'apple'): Promise<FormattedKey[]> {
  const url = provider === 'google' ? GOOGLE_JWKS_URL : APPLE_JWKS_URL;
  const providerFelt = provider === 'google' ? PROVIDER_GOOGLE : PROVIDER_APPLE;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${provider} JWKS`);
  const data: { keys: JWK[] } = await res.json();

  // Valid for ~30 days from now
  const validUntil = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  return data.keys
    .filter((k) => k.kty === 'RSA' && k.alg === 'RS256')
    .map((k) => ({
      kid: k.kid,
      kidFelt: kidToFelt(k.kid),
      nLimbs: modulusToLimbs(k.n),
      provider: providerFelt,
      validUntil,
    }));
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

// ── Sync Logic ──────────────────────────────────────────────────────────────

export async function syncJWKS(network: 'sepolia' | 'mainnet'): Promise<SyncResult> {
  const config = getNetworkConfig(network);
  const results: SyncResult = { added: [], skipped: [], errors: [] };

  // Validate config
  if (!config.registryAddress || !config.adminAddress || !config.adminPrivateKey) {
    throw new Error(`Missing ${network} configuration. Check environment variables.`);
  }

  console.log(`[${network}] Starting JWKS sync...`);
  console.log(`[${network}] Registry: ${config.registryAddress}`);
  console.log(`[${network}] Admin:    ${config.adminAddress}`);

  // Setup provider & account (starknet.js v9 — options object API)
  const provider = new RpcProvider({ nodeUrl: config.rpcUrl });
  const account = new Account({
    provider: { nodeUrl: config.rpcUrl },
    address: config.adminAddress,
    signer: config.adminPrivateKey,
  });
  const contract = new Contract({
    abi: JWKS_REGISTRY_ABI as any,
    address: config.registryAddress,
    providerOrAccount: provider,
  });

  // Fetch keys from all providers
  let googleKeys: FormattedKey[] = [];
  let appleKeys: FormattedKey[] = [];

  try {
    googleKeys = await fetchProviderKeys('google');
    console.log(`[${network}] Fetched ${googleKeys.length} Google keys`);
  } catch (error: any) {
    results.errors.push(`Failed to fetch Google keys: ${error.message}`);
    console.error(`[${network}] Google fetch error:`, error.message);
  }

  try {
    appleKeys = await fetchProviderKeys('apple');
    console.log(`[${network}] Fetched ${appleKeys.length} Apple keys`);
  } catch (error: any) {
    results.errors.push(`Failed to fetch Apple keys: ${error.message}`);
    console.error(`[${network}] Apple fetch error:`, error.message);
  }

  const allKeys = [...googleKeys, ...appleKeys];

  // Process each key
  for (const key of allKeys) {
    try {
      const isValid = await isKeyValidOnChain(contract, key.kidFelt);

      if (isValid) {
        results.skipped.push(key.kid);
        console.log(`[${network}] Key already on-chain: ${key.kid}`);
        continue;
      }

      console.log(`[${network}] Adding new key: ${key.kid}`);

      // Build calldata as flat array — bypasses ABI struct resolution issues.
      // Cairo serializes structs as a flat sequence of felts:
      //   kid, n0..n15, provider, valid_until, is_active
      const calldata = [
        key.kidFelt,
        ...key.nLimbs.map((l) => '0x' + l.toString(16)),
        key.provider,
        '0x' + BigInt(key.validUntil).toString(16),
        '0x1', // is_active = true
      ];

      // Use account.execute() — starknet.js v9 handles V3 transactions natively
      const { transaction_hash } = await account.execute({
        contractAddress: config.registryAddress,
        entrypoint: 'set_key',
        calldata,
      });

      console.log(`[${network}] Transaction submitted: ${transaction_hash}`);

      // Wait for confirmation
      await provider.waitForTransaction(transaction_hash);
      console.log(`[${network}] Transaction confirmed: ${transaction_hash}`);

      results.added.push(key.kid);
    } catch (error: any) {
      const errorMsg = `Failed to add ${key.kid}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`[${network}] ${errorMsg}`);
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
