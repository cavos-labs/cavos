/**
 * JWKS Auto-Sync Service
 * Synchronizes Google and Apple RSA public keys with the on-chain JWKS Registry.
 * Uses starknet.js to sign and submit transactions with the admin wallet.
 */

import { Account, RpcProvider, Contract, CallData } from 'starknet';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

// Provider identifiers as felt252
const PROVIDER_GOOGLE = '0x676f6f676c65'; // 'google'
const PROVIDER_APPLE = '0x6170706c65';    // 'apple'

// JWKS Registry ABI (minimal - only functions we need)
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
    name: 'remove_key',
    inputs: [{ name: 'kid', type: 'core::felt252' }],
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
  {
    type: 'function',
    name: 'get_key',
    inputs: [{ name: 'kid', type: 'core::felt252' }],
    outputs: [{ type: 'JWKSKey' }],
    state_mutability: 'view',
  },
] as const;

interface NetworkConfig {
  rpcUrl: string;
  registryAddress: string;
  adminAddress: string;
  adminPrivateKey: string;
}

interface FormattedKey {
  kid: string;
  kidFelt: string;
  nLimbs: bigint[];
  provider: string;
  validUntil: number;
}

interface SyncResult {
  added: string[];
  skipped: string[];
  errors: string[];
}

/**
 * Get network configuration from environment variables
 */
function getNetworkConfig(network: 'sepolia' | 'mainnet'): NetworkConfig {
  if (network === 'sepolia') {
    return {
      rpcUrl: process.env.STARKNET_RPC_SEPOLIA || 'https://starknet-sepolia.public.blastapi.io',
      registryAddress: process.env.JWKS_REGISTRY_SEPOLIA!,
      adminAddress: process.env.JWKS_ADMIN_ADDRESS_SEPOLIA!,
      adminPrivateKey: process.env.JWKS_ADMIN_PRIVATE_KEY_SEPOLIA!,
    };
  }
  return {
    rpcUrl: process.env.STARKNET_RPC_MAINNET || 'https://starknet-mainnet.public.blastapi.io',
    registryAddress: process.env.JWKS_REGISTRY_MAINNET!,
    adminAddress: process.env.JWKS_ADMIN_ADDRESS_MAINNET!,
    adminPrivateKey: process.env.JWKS_ADMIN_PRIVATE_KEY_MAINNET!,
  };
}

/**
 * Convert Base64URL string to Uint8Array
 */
function base64UrlToBytes(base64url: string): Uint8Array {
  // Replace URL-safe characters with standard Base64
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');

  // Decode Base64
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert bytes to 16 u128 limbs (little-endian) for 2048-bit RSA modulus
 */
function bytesToU128Limbs(bytes: Uint8Array): bigint[] {
  // Pad to 256 bytes (2048 bits)
  const padded = new Uint8Array(256);
  padded.set(bytes, 256 - bytes.length);

  const limbs: bigint[] = [];
  // Process from end to start (little-endian)
  for (let i = 15; i >= 0; i--) {
    let limb = BigInt(0);
    for (let j = 0; j < 16; j++) {
      const byteIdx = i * 16 + (15 - j);
      limb = limb * BigInt(256) + BigInt(padded[byteIdx]);
    }
    limbs.unshift(limb);
  }
  return limbs;
}

/**
 * Convert kid string to felt252 (max 31 bytes)
 */
function kidToFelt(kid: string): string {
  const bytes = new TextEncoder().encode(kid);
  let felt = BigInt(0);
  for (let i = 0; i < bytes.length && i < 31; i++) {
    felt = felt * BigInt(256) + BigInt(bytes[i]);
  }
  return '0x' + felt.toString(16);
}

/**
 * Fetch JWKS from a provider and format for on-chain storage
 */
async function fetchProviderKeys(provider: 'google' | 'apple'): Promise<FormattedKey[]> {
  const url = provider === 'google' ? GOOGLE_JWKS_URL : APPLE_JWKS_URL;
  const providerFelt = provider === 'google' ? PROVIDER_GOOGLE : PROVIDER_APPLE;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${provider} JWKS: ${response.statusText}`);
  }

  const jwks = await response.json();

  return jwks.keys
    .filter((key: any) => key.kty === 'RSA' && key.alg === 'RS256')
    .map((key: any) => {
      // Decode modulus from Base64URL
      const nBytes = base64UrlToBytes(key.n);
      const nLimbs = bytesToU128Limbs(nBytes);

      // Set valid_until to 1 year from now
      const validUntil = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      return {
        kid: key.kid,
        kidFelt: kidToFelt(key.kid),
        nLimbs,
        provider: providerFelt,
        validUntil,
      };
    });
}

/**
 * Check if a key exists and is valid on-chain
 */
async function isKeyValidOnChain(
  contract: Contract,
  kidFelt: string
): Promise<boolean> {
  try {
    const result = await contract.is_key_valid(kidFelt);
    return result === true || result === BigInt(1);
  } catch (error) {
    // Key doesn't exist or error reading - treat as not valid
    return false;
  }
}

/**
 * Sync JWKS keys from providers to on-chain registry
 */
export async function syncJWKS(network: 'sepolia' | 'mainnet'): Promise<SyncResult> {
  const config = getNetworkConfig(network);
  const results: SyncResult = { added: [], skipped: [], errors: [] };

  // Validate config
  if (!config.registryAddress || !config.adminAddress || !config.adminPrivateKey) {
    throw new Error(`Missing ${network} configuration. Check environment variables.`);
  }

  console.log(`[${network}] Starting JWKS sync...`);
  console.log(`[${network}] Registry: ${config.registryAddress}`);
  console.log(`[${network}] Admin: ${config.adminAddress}`);

  // Setup starknet.js
  // Use "latest" as default block identifier — BlastAPI rejects "pending" on all calls
  // (starknet_getNonce, starknet_getClassAt, starknet_estimateFee, etc.)
  const provider = new RpcProvider({ nodeUrl: config.rpcUrl, blockIdentifier: 'latest' });
  const account = new Account(provider, config.adminAddress, config.adminPrivateKey, '1');
  const contract = new Contract(JWKS_REGISTRY_ABI as any, config.registryAddress, account);

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

      // Build calldata as a flat hex array to bypass starknet.js ABI struct
      // resolution. contract.populate() fails with "Cannot convert undefined to
      // a BigInt" because it cannot resolve the unqualified 'JWKSKey' type name
      // from the minimal ABI — Cairo serializes structs as a flat sequence of
      // felts, so we can safely build the calldata directly.
      const calldata = [
        key.kidFelt,                                          // kid: felt252
        ...key.nLimbs.map(l => '0x' + l.toString(16)),      // n0–n15: u128 (16 felts)
        key.provider,                                         // provider: felt252
        '0x' + BigInt(key.validUntil).toString(16),          // valid_until: u64
        '0x1',                                               // is_active: bool
      ];

      const populatedCall = {
        contractAddress: contract.address,
        entrypoint: 'set_key',
        calldata,
      };

      // Submit transaction — fetch nonce with "latest" because some RPC providers
      // (e.g. BlastAPI) reject starknet_getNonce with block_id "pending".
      const nonce = await account.getNonce('latest');
      const tx = await account.execute([populatedCall], { nonce });
      console.log(`[${network}] Transaction submitted: ${tx.transaction_hash}`);

      // Wait for confirmation
      await provider.waitForTransaction(tx.transaction_hash);
      console.log(`[${network}] Transaction confirmed: ${tx.transaction_hash}`);

      results.added.push(key.kid);
    } catch (error: any) {
      const errorMsg = `Failed to add ${key.kid}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`[${network}] ${errorMsg}`);
    }
  }

  console.log(`[${network}] Sync complete. Added: ${results.added.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`);
  return results;
}

/**
 * Sync JWKS for both networks
 */
export async function syncAllNetworks(): Promise<{
  sepolia: SyncResult;
  mainnet: SyncResult;
}> {
  const results = {
    sepolia: { added: [], skipped: [], errors: [] } as SyncResult,
    mainnet: { added: [], skipped: [], errors: [] } as SyncResult,
  };

  // Sync Sepolia
  try {
    results.sepolia = await syncJWKS('sepolia');
  } catch (error: any) {
    results.sepolia.errors.push(`Sepolia sync failed: ${error.message}`);
    console.error('Sepolia sync failed:', error);
  }

  // Sync Mainnet
  try {
    results.mainnet = await syncJWKS('mainnet');
  } catch (error: any) {
    results.mainnet.errors.push(`Mainnet sync failed: ${error.message}`);
    console.error('Mainnet sync failed:', error);
  }

  return results;
}
