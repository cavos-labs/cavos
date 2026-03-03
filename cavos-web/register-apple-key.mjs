/**
 * Register Apple JWKS key trustlessly via Reclaim proof.
 * Run: node register-apple-key.mjs
 */
import { ReclaimClient } from '@reclaimprotocol/zk-fetch';
import { Account, RpcProvider } from 'starknet';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const RPC_URL     = env['STARKNET_RPC_SEPOLIA'] || 'https://free-rpc.nethermind.io/sepolia-juno/v0_7';
const SUBMITTER   = env['JWKS_SUBMITTER_ADDRESS_SEPOLIA'] || env['JWKS_ADMIN_ADDRESS_SEPOLIA'];
const PRIVATE_KEY = env['JWKS_SUBMITTER_PRIVATE_KEY_SEPOLIA'] || env['JWKS_ADMIN_PRIVATE_KEY_SEPOLIA'];

const TRUSTLESS_REGISTRY = '0x06f88f78418d1a3d0b238d61fd4fadec5d2d8e17c7356a605674fd83a8f73fac';
const JWKS_REGISTRY      = '0x04159cfcf03bfd6c294245147f065f2efb09c12c33f46c4611c86d8e4f3fb639';
const PROVIDER_APPLE     = '0x6170706c65'; // 'apple' as felt252

// ── Key math ──────────────────────────────────────────────────────────────────
function kidToFelt(kid) {
  const bytes = Buffer.from(kid, 'utf8');
  let felt = 0n;
  for (let i = 0; i < Math.min(bytes.length, 31); i++) felt = felt * 256n + BigInt(bytes[i]);
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

function hexToU256(hexStr) {
  const hex = (hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr).padStart(64, '0');
  return { low: '0x' + hex.slice(32), high: '0x' + hex.slice(0, 32) };
}

function encodeByteArray(str) {
  const bytes = Buffer.from(str, 'utf8');
  const result = [];
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

function parseSigToFelts(sigHex) {
  const hex = sigHex.startsWith('0x') ? sigHex.slice(2) : sigHex;
  const r = hexToU256('0x' + hex.slice(0, 64));
  const s = hexToU256('0x' + hex.slice(64, 128));
  const v = parseInt(hex.slice(128, 130), 16);
  return [r.low, r.high, s.low, s.high, '0x' + v.toString(16)];
}

// ── Step 1: Generate Reclaim proof ───────────────────────────────────────────
console.log('Step 1: Generating Reclaim zkFetch proof for Apple JWKS...');
const client = new ReclaimClient(env['RECLAIM_APP_ID'], env['RECLAIM_APP_SECRET']);

const proof = await client.zkFetch(
  'https://appleid.apple.com/auth/keys',
  { method: 'GET' },
  {
    responseMatches: [
      { type: 'regex', value: '"kid":\\s*"(?<kid>[^"]+)"' },
      { type: 'regex', value: '"n":\\s*"(?<n>[^"]+)"' },
    ],
  }
);

const ctx = JSON.parse(proof.claimData.context);
const kid = ctx.extractedParameters.kid;
const nB64 = ctx.extractedParameters.n;
console.log('  kid:', kid);
console.log('  providerHash:', ctx.providerHash);

// ── Step 2: Compute JWKSKey ───────────────────────────────────────────────────
console.log('\nStep 2: Computing JWKSKey limbs + Montgomery constants...');
const nLimbs = modulusToLimbs(nB64);
const { nPrime, rSq } = calculateMontgomery(nLimbs);
const kidFelt = kidToFelt(kid);
const validUntil = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
console.log('  kidFelt:', kidFelt);

// ── Step 3: Check if already on-chain ────────────────────────────────────────
console.log('\nStep 3: Checking if key already registered...');
const rpcProvider = new RpcProvider({ nodeUrl: RPC_URL });
const isValidResult = await rpcProvider.callContract({
  contractAddress: JWKS_REGISTRY,
  entrypoint: 'is_key_valid',
  calldata: [kidFelt],
});
const alreadyValid = isValidResult[0] === '0x1' || isValidResult[0] === '1';
console.log(' ', alreadyValid ? 'Already on-chain — re-registering to test.' : 'Not registered yet, proceeding.');

// ── Step 4: Build calldata ────────────────────────────────────────────────────
console.log('\nStep 4: Building calldata...');
const claimData = proof.claimData ?? {};
const identifierHex = claimData.identifier ?? proof.identifier ?? '0x0';
const idU256 = hexToU256(identifierHex);
const sigs = proof.signatures ?? [];

const calldata = [
  '0x0',
  ...encodeByteArray(claimData.provider ?? 'http'),
  ...encodeByteArray(claimData.parameters ?? ''),
  ...encodeByteArray(claimData.context ?? ''),
  idU256.low, idU256.high,
  ...encodeByteArray(identifierHex),
  ...encodeByteArray(claimData.owner ?? ''),
  ...encodeByteArray(String(claimData.epoch ?? '1')),
  ...encodeByteArray(String(claimData.timestampS ?? '0')),
  '0x' + sigs.length.toString(16),
  ...sigs.flatMap(parseSigToFelts),
  kidFelt,
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
  PROVIDER_APPLE,
  h(BigInt(validUntil)),
  '0x1',
];
console.log('  Calldata length:', calldata.length, 'felts');

// ── Step 5: Submit ────────────────────────────────────────────────────────────
console.log('\nStep 5: Submitting register_key transaction...');
const account = new Account({ provider: { nodeUrl: RPC_URL }, address: SUBMITTER, signer: PRIVATE_KEY });

const { transaction_hash } = await account.execute({
  contractAddress: TRUSTLESS_REGISTRY,
  entrypoint: 'register_key',
  calldata,
});
console.log('  tx:', transaction_hash);
await rpcProvider.waitForTransaction(transaction_hash);
console.log('  Confirmed!');

// ── Step 6: Verify ────────────────────────────────────────────────────────────
console.log('\nStep 6: Verifying on-chain...');
const check = await rpcProvider.callContract({
  contractAddress: JWKS_REGISTRY,
  entrypoint: 'is_key_valid',
  calldata: [kidFelt],
});
const ok = check[0] === '0x1' || check[0] === '1';
console.log('  is_key_valid:', ok ? '✅ YES' : '❌ NO');
if (ok) console.log(`\n✅ Apple key ${kid} registered trustlessly on Sepolia.`);
