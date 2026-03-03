/**
 * One-time setup: register the Firebase RSA key in the JWKS registry.
 *
 * Flow:
 *   1. transfer_jwks_admin(owner) — trustless contract gives admin back to owner
 *   2. jwks_registry.set_key(firebase_kid, firebase_key) — owner registers Firebase key
 *   3. jwks_registry.transfer_admin(trustless_contract) — owner gives admin back to trustless
 *
 * Run: node setup-firebase-key.mjs
 */
import { RpcProvider, Account, CallData, Contract } from 'starknet';
import { readFileSync } from 'fs';
import crypto from 'crypto';

// ── Load env ──────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const RPC_URL          = env['STARKNET_RPC_SEPOLIA'] || 'https://free-rpc.nethermind.io/sepolia-juno/v0_7';
const OWNER_ADDRESS    = env['JWKS_SUBMITTER_ADDRESS_SEPOLIA'] || env['JWKS_ADMIN_ADDRESS_SEPOLIA'];
const OWNER_PK         = env['JWKS_SUBMITTER_PRIVATE_KEY_SEPOLIA'] || env['JWKS_ADMIN_PRIVATE_KEY_SEPOLIA'];

const TRUSTLESS        = '0x06f88f78418d1a3d0b238d61fd4fadec5d2d8e17c7356a605674fd83a8f73fac';
const JWKS_REGISTRY    = '0x04159cfcf03bfd6c294245147f065f2efb09c12c33f46c4611c86d8e4f3fb639';
const PROVIDER_FIREBASE = '0x6669726562617365'; // 'firebase' as felt252

// ── Read Firebase public key ──────────────────────────────────────────────────
const pemPath = new URL('./firebase_public.pem', import.meta.url).pathname;
const pem = readFileSync(pemPath, 'utf8');
const cryptoKey = crypto.createPublicKey(pem);
const jwk = cryptoKey.export({ format: 'jwk' });

const FIREBASE_KID = env['FIREBASE_RSA_KID'] || 'firebase-2026';
const nB64 = jwk.n; // base64url-encoded RSA modulus

console.log('Firebase kid:', FIREBASE_KID);
console.log('Modulus (first 40 chars):', nB64.slice(0, 40) + '...');

// ── Key math ──────────────────────────────────────────────────────────────────
function kidToFelt(kid) {
  const bytes = Buffer.from(kid, 'utf8');
  let felt = 0n;
  for (let i = 0; i < Math.min(bytes.length, 31); i++) {
    felt = felt * 256n + BigInt(bytes[i]);
  }
  return '0x' + felt.toString(16);
}

function modulusToLimbs(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');
  const bytes = Buffer.from(base64, 'base64');
  const padded = Buffer.alloc(256);
  bytes.copy(padded, 256 - bytes.length);
  const limbs = [];
  for (let i = 15; i >= 0; i--) {
    let v = 0n;
    for (let j = 0; j < 16; j++) v = v * 256n + BigInt(padded[i * 16 + j]);
    limbs.push(v);
  }
  return limbs;
}

function calculateMontgomery(nLimbs) {
  let n = 0n;
  for (let i = 0; i < nLimbs.length; i++) n += nLimbs[i] * (1n << (BigInt(i) * 128n));
  const R = 1n << 2048n;
  const modInv = (a, m) => {
    let [t, newt, r, newr] = [0n, 1n, m, a];
    while (newr) { const q = r / newr; [t, newt] = [newt, t - q * newt]; [r, newr] = [newr, r - q * newr]; }
    return t < 0n ? t + m : t;
  };
  const nPrimeVal = (R - modInv(n, R)) % R;
  const rSqVal = (R * R) % n;
  const toLimbs = v => Array.from({ length: 16 }, (_, i) => (v >> (BigInt(i) * 128n)) & ((1n << 128n) - 1n));
  return { nPrime: toLimbs(nPrimeVal), rSq: toLimbs(rSqVal) };
}

function h(v) { return '0x' + v.toString(16); }

// ── Compute key ───────────────────────────────────────────────────────────────
const nLimbs = modulusToLimbs(nB64);
const { nPrime, rSq } = calculateMontgomery(nLimbs);
const kidFelt = kidToFelt(FIREBASE_KID);
const validUntil = Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60; // 10 years

console.log('\nkidFelt:', kidFelt);
console.log('n0 (LSB limb):', h(nLimbs[0]));

// ── Setup ─────────────────────────────────────────────────────────────────────
if (!OWNER_ADDRESS || !OWNER_PK) {
  console.error('Missing JWKS_SUBMITTER_ADDRESS_SEPOLIA / JWKS_SUBMITTER_PRIVATE_KEY_SEPOLIA');
  process.exit(1);
}

const provider = new RpcProvider({ nodeUrl: RPC_URL });
const account = new Account({ provider: { nodeUrl: RPC_URL }, address: OWNER_ADDRESS, signer: OWNER_PK });

// ── Step 1: Transfer JWKS admin from trustless contract → owner ───────────────
console.log('\nStep 1: Returning JWKS admin from trustless → owner...');
const { transaction_hash: tx1 } = await account.execute({
  contractAddress: TRUSTLESS,
  entrypoint: 'transfer_jwks_admin',
  calldata: CallData.compile({ new_admin: OWNER_ADDRESS }),
});
console.log('  tx:', tx1);
await provider.waitForTransaction(tx1);
console.log('  Confirmed!');

// ── Step 2: Register Firebase key from owner ──────────────────────────────────
console.log('\nStep 2: Registering Firebase key in JWKS registry...');

const keyCalldata = [
  h(nLimbs[0]),  h(nLimbs[1]),  h(nLimbs[2]),  h(nLimbs[3]),
  h(nLimbs[4]),  h(nLimbs[5]),  h(nLimbs[6]),  h(nLimbs[7]),
  h(nLimbs[8]),  h(nLimbs[9]),  h(nLimbs[10]), h(nLimbs[11]),
  h(nLimbs[12]), h(nLimbs[13]), h(nLimbs[14]), h(nLimbs[15]),
  h(rSq[0]),  h(rSq[1]),  h(rSq[2]),  h(rSq[3]),
  h(rSq[4]),  h(rSq[5]),  h(rSq[6]),  h(rSq[7]),
  h(rSq[8]),  h(rSq[9]),  h(rSq[10]), h(rSq[11]),
  h(rSq[12]), h(rSq[13]), h(rSq[14]), h(rSq[15]),
  h(nPrime[0]),  h(nPrime[1]),  h(nPrime[2]),  h(nPrime[3]),
  h(nPrime[4]),  h(nPrime[5]),  h(nPrime[6]),  h(nPrime[7]),
  h(nPrime[8]),  h(nPrime[9]),  h(nPrime[10]), h(nPrime[11]),
  h(nPrime[12]), h(nPrime[13]), h(nPrime[14]), h(nPrime[15]),
  PROVIDER_FIREBASE,
  h(BigInt(validUntil)),
  '0x1', // is_active: true
];

const { transaction_hash: tx2 } = await account.execute({
  contractAddress: JWKS_REGISTRY,
  entrypoint: 'set_key',
  calldata: [kidFelt, ...keyCalldata],
});
console.log('  tx:', tx2);
await provider.waitForTransaction(tx2);
console.log('  Confirmed!');

// ── Step 3: Return admin to trustless contract ────────────────────────────────
console.log('\nStep 3: Returning JWKS admin → trustless contract...');
const { transaction_hash: tx3 } = await account.execute({
  contractAddress: JWKS_REGISTRY,
  entrypoint: 'transfer_admin',
  calldata: CallData.compile({ new_admin: TRUSTLESS }),
});
console.log('  tx:', tx3);
await provider.waitForTransaction(tx3);
console.log('  Confirmed!');

// ── Verify ────────────────────────────────────────────────────────────────────
console.log('\nVerifying Firebase key on-chain...');
const result = await provider.callContract({
  contractAddress: JWKS_REGISTRY,
  entrypoint: 'is_key_valid',
  calldata: [kidFelt],
});
const isValid = result[0] === '0x1' || result[0] === '1';
console.log('is_key_valid:', isValid ? '✅ YES' : '❌ NO');

if (isValid) {
  console.log(`\n✅ Firebase key '${FIREBASE_KID}' registered immutably on Sepolia.`);
  console.log('   The trustless contract is now admin again — only it can update this key,');
  console.log('   and it has no mechanism to do so without a Reclaim proof for Firebase.');
} else {
  console.log('\n❌ Key not found after registration.');
}
