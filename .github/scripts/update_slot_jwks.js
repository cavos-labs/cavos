#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const starknet = loadStarknet();
const { RpcProvider, Account, CallData, hash, byteArray } = starknet;

const DEFAULT_REGISTRY_ADDRESSES = [
  '0x0112c6a8a69e4d9a2e74b4638e1495d69266de9f6f796727d4a52a7ab0a48db2',
  '0x076ff6853197538b4d4c925b2c775014fae9b5c14f63262b13f2e49f732e21f7',
];

// Each parity registry is admin-gated by a distinct account. On this Katana
// dev_setStorageAt is a no-op, so admin was never handed to a shared operator —
// it stays the real Sepolia/Mainnet registry admin baked in at construction.
// set_key must therefore be signed by the matching admin for each registry.
const REGISTRY_ADMINS = {
  // Sepolia-parity registry -> real Sepolia registry admin
  '0x0112c6a8a69e4d9a2e74b4638e1495d69266de9f6f796727d4a52a7ab0a48db2': {
    address: '0x3d57e5e7421a70396a69274e8dd57dadfc5e38541d27e7a742116c3ef34bb33',
    privateKey: '0x4f7f6f0f318769325539bad869cde209e2cc559753517b9a825314bc393ede',
  },
  // Mainnet-parity registry -> real Mainnet registry admin
  '0x076ff6853197538b4d4c925b2c775014fae9b5c14f63262b13f2e49f732e21f7': {
    address: '0x1d50c5720b760213700aa19ae017bd1bf54ab208325093899df658ac2259897',
    privateKey: '0x61d6bcc6dd46bacd5aa23152703a455b306ecad09320f4ed28ec9b4bb27f62e',
  },
};

const DEFAULT_CONFIG = {
  rpcUrl: 'https://katana.testnet.jokersofneon.com',
  registryAddresses: DEFAULT_REGISTRY_ADDRESSES,
  outputFile: 'slot-jwks-update-summary.json',
};

const ISS_MAP = {
  google: '0x' + Buffer.from('https://accounts.google.com').toString('hex'),
  apple: '0x' + Buffer.from('https://appleid.apple.com').toString('hex'),
  cavos: '0x' + Buffer.from('https://cavos.app/firebase').toString('hex'),
};

const CONFIG = resolveConfig(process.argv.slice(2), process.env);

async function main() {
  validateConfig(CONFIG);

  console.log('===========================================');
  console.log('  Cavos Slot JWKS Refresh');
  console.log('===========================================\n');
  console.log(`RPC URL:     ${CONFIG.rpcUrl}`);
  console.log(`Registries:  ${CONFIG.registryAddresses.join(', ')}`);
  console.log(`Output file: ${CONFIG.outputFile}\n`);

  const provider = new RpcProvider({ nodeUrl: CONFIG.rpcUrl });

  const chainId = await provider.getChainId();
  console.log(`Chain ID: ${chainId}\n`);

  const providerKeys = {
    google: await fetchGoogleJWKS(),
    apple: await fetchAppleJWKS(),
    cavos: await fetchCavosJWKS(),
  };

  const summary = {
    refreshedAt: new Date().toISOString(),
    chainId,
    rpcUrl: CONFIG.rpcUrl,
    registries: {},
    providerCounts: Object.fromEntries(
      Object.entries(providerKeys).map(([name, keys]) => [name, keys.length]),
    ),
  };

  for (const registryAddress of CONFIG.registryAddresses) {
    const admin = resolveAdmin(registryAddress);
    console.log(`Updating registry ${registryAddress} (admin ${admin.address})...`);
    const calls = buildCalls(registryAddress, providerKeys);
    if (calls.length === 0) {
      throw new Error(`No JWKS calls generated for ${registryAddress}`);
    }

    const account = new Account({
      provider,
      address: admin.address,
      signer: admin.privateKey,
      cairoVersion: '1',
    });

    const execution = await account.execute(calls);
    console.log(`  Submitted tx: ${execution.transaction_hash}`);
    await provider.waitForTransaction(execution.transaction_hash);
    console.log(`  Confirmed ${calls.length} set_key calls`);

    const verification = await verifyRegistry(provider, registryAddress, providerKeys);
    summary.registries[registryAddress] = {
      admin: admin.address,
      transactionHash: execution.transaction_hash,
      callCount: calls.length,
      verification,
    };

    printVerification(registryAddress, verification);
    ensureVerificationPassed(registryAddress, verification);
    console.log('');
  }

  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(summary, null, 2));
  console.log(`Summary written to ${CONFIG.outputFile}`);
}

function resolveAdmin(registryAddress) {
  const admin = CONFIG.registryAdmins[normalizeHex(registryAddress)];
  if (!admin || !admin.address || !admin.privateKey) {
    throw new Error(
      `No admin credentials configured for registry ${registryAddress}. ` +
        'Add it to REGISTRY_ADMINS or SLOT_REGISTRY_ADMINS.'
    );
  }
  return admin;
}

function buildCalls(registryAddress, providerKeys) {
  const calls = [];

  for (const [providerName, keys] of Object.entries(providerKeys)) {
    for (const key of keys) {
      calls.push({
        contractAddress: registryAddress,
        entrypoint: 'set_key',
        calldata: [
          computeKidFelt(key.kid),
          ...modulusToU96Limbs(key.n),
          ISS_MAP[providerName],
          providerName === 'cavos' ? computeValidUntilOneYear() : 0,
          1,
        ],
      });
    }
  }

  return calls;
}

async function verifyRegistry(provider, registryAddress, providerKeys) {
  const verification = {};

  for (const [providerName, keys] of Object.entries(providerKeys)) {
    if (keys.length === 0) {
      verification[providerName] = { ok: false, reason: 'No keys fetched' };
      continue;
    }

    const checked = [];
    const missing = [];

    for (const key of keys) {
      try {
        const response = await provider.callContract({
          contractAddress: registryAddress,
          entrypoint: 'get_key_if_valid',
          calldata: [computeKidFelt(key.kid)],
        });
        const ok = Array.isArray(response) && response.some((value) => normalizeHex(value) !== '0x0');
        checked.push(key.kid);
        if (!ok) missing.push(key.kid);
      } catch (error) {
        checked.push(key.kid);
        missing.push(`${key.kid}: ${error.message}`);
      }
    }

    verification[providerName] = {
      ok: missing.length === 0,
      checked,
      ...(missing.length > 0 ? { missing } : {}),
    };
  }

  return verification;
}

function printVerification(registryAddress, verification) {
  console.log(`  Verification for ${registryAddress}:`);
  for (const [providerName, result] of Object.entries(verification)) {
    console.log(`    ${providerName}: ${result.ok ? 'ok' : 'failed'}`);
  }
}

function ensureVerificationPassed(registryAddress, verification) {
  for (const [providerName, result] of Object.entries(verification)) {
    if (!result.ok) {
      throw new Error(
        `Verification failed for ${providerName} on ${registryAddress}: ${result.reason || 'unknown error'}`
      );
    }
  }
}

function computeKidFelt(kid) {
  return hash.computePoseidonHashOnElements(CallData.compile(byteArray.byteArrayFromString(kid)));
}

function modulusToU96Limbs(base64urlN) {
  const paddedBase64 = base64urlN
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64urlN.length + (4 - (base64urlN.length % 4)) % 4, '=');
  const nBytes = Buffer.from(paddedBase64, 'base64');
  const padded = Buffer.alloc(288, 0);
  nBytes.copy(padded, 288 - nBytes.length);

  const limbs = [];
  for (let i = 23; i >= 0; i -= 1) {
    let limb = 0n;
    for (let j = 0; j < 12; j += 1) {
      limb = (limb << 8n) | BigInt(padded[i * 12 + j]);
    }
    limbs.push('0x' + limb.toString(16));
  }

  return limbs;
}

function computeValidUntilOneYear() {
  return Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
}

async function fetchGoogleJWKS() {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  return filterRsaKeys(response, 'Google');
}

async function fetchAppleJWKS() {
  const response = await fetch('https://appleid.apple.com/auth/keys');
  return filterRsaKeys(response, 'Apple');
}

async function fetchCavosJWKS() {
  const response = await fetch('https://cavos.xyz/.well-known/jwks.json');
  return filterRsaKeys(response, 'Cavos');
}

async function filterRsaKeys(response, providerName) {
  if (!response.ok) {
    throw new Error(`${providerName} JWKS fetch failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  return (payload.keys || []).filter((key) => key.kty === 'RSA' && key.alg === 'RS256');
}

function resolveConfig(argv, env) {
  const cli = parseArgs(argv);
  const outputFile = cli.outputFile || env.SLOT_OUTPUT_FILE || DEFAULT_CONFIG.outputFile;
  const registryAddresses =
    cli.registryAddresses ||
    env.SLOT_JWKS_REGISTRY_ADDRESSES ||
    DEFAULT_CONFIG.registryAddresses.join(',');

  return {
    rpcUrl: cli.rpcUrl || env.SLOT_RPC_URL || DEFAULT_CONFIG.rpcUrl,
    registryAddresses: registryAddresses
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    registryAdmins: resolveRegistryAdmins(env),
    outputFile: path.isAbsolute(outputFile) ? outputFile : path.join(process.cwd(), outputFile),
  };
}

// Build a registry(normalized) -> { address, privateKey } map. Defaults come
// from REGISTRY_ADMINS; SLOT_REGISTRY_ADMINS (JSON) can override/extend it.
function resolveRegistryAdmins(env) {
  const admins = {};
  for (const [registry, admin] of Object.entries(REGISTRY_ADMINS)) {
    admins[normalizeHex(registry)] = { ...admin };
  }
  if (env.SLOT_REGISTRY_ADMINS) {
    let override;
    try {
      override = JSON.parse(env.SLOT_REGISTRY_ADMINS);
    } catch (error) {
      throw new Error(`SLOT_REGISTRY_ADMINS is not valid JSON: ${error.message}`);
    }
    for (const [registry, admin] of Object.entries(override)) {
      admins[normalizeHex(registry)] = admin;
    }
  }
  return admins;
}

function validateConfig(config) {
  const missing = [];
  if (!config.rpcUrl) missing.push('SLOT_RPC_URL');
  if (!config.registryAddresses.length) missing.push('SLOT_JWKS_REGISTRY_ADDRESSES');

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  for (const registry of config.registryAddresses) {
    const admin = config.registryAdmins[normalizeHex(registry)];
    if (!admin || !admin.address || !admin.privateKey) {
      throw new Error(
        `No admin credentials for registry ${registry}. Configure REGISTRY_ADMINS or SLOT_REGISTRY_ADMINS.`
      );
    }
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[toCamelCase(key)] = next;
      i += 1;
    } else {
      args[toCamelCase(key)] = 'true';
    }
  }
  return args;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function normalizeHex(value) {
  return '0x' + BigInt(value).toString(16);
}

function loadStarknet() {
  const scopedRequire = createRequire(__filename);
  const candidates = [
    'starknet',
    path.join(__dirname, '..', '..', 'cavos-web', 'node_modules', 'starknet'),
  ];

  for (const candidate of candidates) {
    try {
      return scopedRequire(candidate);
    } catch (error) {
      // Try next candidate.
    }
  }

  throw new Error(
    "Unable to resolve the 'starknet' package. Install cavos-web dependencies before running this script."
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\nFATAL:', error);
    process.exit(1);
  });
}
