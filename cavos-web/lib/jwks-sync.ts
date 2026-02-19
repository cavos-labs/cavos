/**
 * JWKS Auto-Sync Service
 * Synchronizes Google and Apple RSA public keys with the on-chain JWKS Registry.
 * Uses starknet.js to sign and submit transactions with the admin wallet.
 */

import { Account, RpcProvider, Contract, CallData, hash, ec, transaction, num } from 'starknet';
import { poseidonHashMany } from '@scure/starknet';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

// Provider identifiers as felt252
const PROVIDER_GOOGLE = '0x676f6f676c65'; // 'google'
const PROVIDER_APPLE = '0x6170706c65';    // 'apple'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ABI Definition (minimal – only entries used by this service)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Network Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

/**
 * Get network configuration from environment variables
 */
function getNetworkConfig(network: 'sepolia' | 'mainnet'): NetworkConfig {
  if (network === 'sepolia') {
    return {
      rpcUrl: process.env.STARKNET_RPC_SEPOLIA || 'https://free-rpc.nethermind.io/sepolia-juno/v0_7',
      registryAddress: process.env.JWKS_REGISTRY_SEPOLIA!,
      adminAddress: process.env.JWKS_ADMIN_ADDRESS_SEPOLIA!,
      adminPrivateKey: process.env.JWKS_ADMIN_PRIVATE_KEY_SEPOLIA!,
    };
  }
  return {
    rpcUrl: process.env.STARKNET_RPC_MAINNET || 'https://free-rpc.nethermind.io/mainnet-juno/v0_7',
    registryAddress: process.env.JWKS_REGISTRY_MAINNET!,
    adminAddress: process.env.JWKS_ADMIN_ADDRESS_MAINNET!,
    adminPrivateKey: process.env.JWKS_ADMIN_PRIVATE_KEY_MAINNET!,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  JWKS Fetch & Process
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
 * Convert a string to felt252 (max 31 bytes).
 * Truncates to 31 bytes if longer.
 */
function kidToFelt(kid: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(kid);
  let hex = '0x';
  for (let i = 0; i < Math.min(bytes.length, 31); i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Decode a base64url RSA modulus into 16 × 128-bit limbs (big-endian).
 */
function modulusToLimbs(base64url: string): bigint[] {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');

  const bytes = Buffer.from(base64, 'base64');

  // Pad to 256 bytes (2048-bit RSA)
  const padded = Buffer.alloc(256);
  bytes.copy(padded, 256 - bytes.length);

  const limbs: bigint[] = [];
  for (let i = 0; i < 16; i++) {
    const chunk = padded.slice(i * 16, (i + 1) * 16);
    let value = BigInt(0);
    for (let j = 0; j < chunk.length; j++) {
      value = (value << BigInt(8)) | BigInt(chunk[j]);
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

  // valid for ~30 days from now
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  V3 Invoke Transaction (manual — bypasses starknet.js 6.24 limitations)
//
//  starknet.js 6.24.1 has two issues:
//    1. V1 `estimateInvokeFee` hits "Cannot convert undefined to a BigInt"
//    2. V3 hash computation omits `l1_data_gas` (needed by Starknet ≥ 0.13.2)
//
//  We compute the V3 transaction hash ourselves, sign it directly via
//  ec.starkCurve, and submit via raw JSON-RPC.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RESOURCE_VALUE_OFFSET = BigInt(64 + 128); // max_amount(64) + max_price(128) = 192 bits
const MAX_PRICE_BITS = BigInt(128);

function encodeShortString(s: string): bigint {
  let result = BigInt(0);
  for (let i = 0; i < s.length; i++) {
    result = (result << BigInt(8)) | BigInt(s.charCodeAt(i));
  }
  return result;
}

const L1_GAS_NAME = encodeShortString('L1_GAS');
const L2_GAS_NAME = encodeShortString('L2_GAS');
const L1_DATA_GAS_NAME = encodeShortString('L1_DATA_GAS');

interface ResourceBound {
  max_amount: string;
  max_price_per_unit: string;
}

function encodeResourceBound(gasName: bigint, bound: ResourceBound): bigint {
  return (
    (gasName << RESOURCE_VALUE_OFFSET) +
    (BigInt(bound.max_amount) << MAX_PRICE_BITS) +
    BigInt(bound.max_price_per_unit)
  );
}

const DA_MODE_L1 = BigInt(0);

/**
 * Compute the V3 invoke transaction hash matching Starknet ≥ 0.13.2.
 * The key difference from starknet.js 6.24 is including L1_DATA_GAS
 * in the fee-field Poseidon hash.
 */
function computeV3InvokeTxHash(
  senderAddress: string,
  compiledCalldata: string[],
  chainId: string,
  nonce: string,
  resourceBounds: { l1_gas: ResourceBound; l2_gas: ResourceBound; l1_data_gas: ResourceBound },
  tip: bigint = BigInt(0),
): string {
  const INVOKE_PREFIX = BigInt('0x696e766f6b65'); // 'invoke'
  const VERSION = BigInt(3);

  // Fee field hash — includes l1_data_gas (Starknet 0.13.2+)
  const l1Bound = encodeResourceBound(L1_GAS_NAME, resourceBounds.l1_gas);
  const l2Bound = encodeResourceBound(L2_GAS_NAME, resourceBounds.l2_gas);
  const l1DataBound = encodeResourceBound(L1_DATA_GAS_NAME, resourceBounds.l1_data_gas);
  const feeFieldHash = poseidonHashMany([tip, l1Bound, l2Bound, l1DataBound]);

  // DA mode hash (both L1 = 0)
  const daModeHash = (DA_MODE_L1 << BigInt(32)) + DA_MODE_L1;

  // Paymaster data hash (empty)
  const paymasterHash = poseidonHashMany([]);

  // Account deployment data hash (empty)
  const accountDeploymentHash = poseidonHashMany([]);

  // Calldata hash
  const calldataHash = poseidonHashMany(compiledCalldata.map(c => BigInt(c)));

  // Final hash
  return num.toHex(poseidonHashMany([
    INVOKE_PREFIX,
    VERSION,
    BigInt(senderAddress),
    feeFieldHash,
    paymasterHash,
    BigInt(chainId),
    BigInt(nonce),
    daModeHash,
    accountDeploymentHash,
    calldataHash,
  ]));
}

async function submitV3Invoke(
  rpcUrl: string,
  adminAddress: string,
  adminPrivateKey: string,
  provider: RpcProvider,
  calls: { contractAddress: string; entrypoint: string; calldata: string[] }[],
): Promise<string> {
  // 1. Get nonce
  const nonceResult = await provider.getNonceForAddress(adminAddress, 'latest');
  const nonce = '0x' + BigInt(nonceResult).toString(16);

  // 2. Compile calldata for __execute__
  const compiledCalldata = transaction.getExecuteCalldata(calls, '1');

  // 3. Resource bounds (generous caps — actual fee is much lower)
  const resourceBounds = {
    l1_gas: { max_amount: '0x3000', max_price_per_unit: '0x174876E800' },
    l2_gas: { max_amount: '0x30000', max_price_per_unit: '0x174876E800' },
    l1_data_gas: { max_amount: '0x3000', max_price_per_unit: '0x174876E800' },
  };

  // 4. Chain ID
  const chainId = await provider.getChainId();

  // 5. Compute the correct V3 transaction hash (with l1_data_gas)
  const txHash = computeV3InvokeTxHash(
    adminAddress,
    compiledCalldata as string[],
    chainId,
    nonce,
    resourceBounds,
  );

  // 6. Sign the hash directly with the private key
  const sig = ec.starkCurve.sign(txHash, adminPrivateKey);
  const sigArray = [
    '0x' + sig.r.toString(16),
    '0x' + sig.s.toString(16),
  ];

  // 7. Build JSON-RPC payload
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'starknet_addInvokeTransaction',
    params: {
      invoke_transaction: {
        type: 'INVOKE',
        sender_address: adminAddress,
        calldata: compiledCalldata.map((c: any) => '0x' + BigInt(c).toString(16)),
        version: '0x3',
        signature: sigArray,
        nonce,
        resource_bounds: resourceBounds,
        tip: '0x0',
        paymaster_data: [],
        account_deployment_data: [],
        nonce_data_availability_mode: 'L1',
        fee_data_availability_mode: 'L1',
      },
    },
  };

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json: any = await res.json();

  if (json.error) {
    throw new Error(`RPC error ${json.error.code}: ${json.error.message || JSON.stringify(json.error.data)}`);
  }

  return json.result.transaction_hash;
}

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
      const txHash = await submitV3Invoke(config.rpcUrl, config.adminAddress, config.adminPrivateKey, provider, [populatedCall]);
      console.log(`[${network}] Transaction submitted: ${txHash}`);

      // Wait for confirmation
      await provider.waitForTransaction(txHash);
      console.log(`[${network}] Transaction confirmed: ${txHash}`);

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
