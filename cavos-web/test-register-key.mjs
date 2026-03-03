/**
 * End-to-end test: generate Reclaim proof for Google JWKS → register_key on-chain.
 * Run: node test-register-key.mjs
 */
import { ReclaimClient } from '@reclaimprotocol/zk-fetch';
import { Account, RpcProvider, CallData } from 'starknet';
import { readFileSync } from 'fs';

// ── Load env ─────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const APP_ID      = env['RECLAIM_APP_ID'];
const APP_SECRET  = env['RECLAIM_APP_SECRET'];
const RPC_URL     = env['STARKNET_RPC_SEPOLIA'] || 'https://free-rpc.nethermind.io/sepolia-juno/v0_7';
const SUBMITTER   = env['JWKS_SUBMITTER_ADDRESS_SEPOLIA'] || env['JWKS_ADMIN_ADDRESS_SEPOLIA'];
const PRIVATE_KEY = env['JWKS_SUBMITTER_PRIVATE_KEY_SEPOLIA'] || env['JWKS_ADMIN_PRIVATE_KEY_SEPOLIA'];

const TRUSTLESS_REGISTRY = '0x0799a62af4659b06a188f560146feedda240015ddd4d300e533241f8b255c812';
const JWKS_REGISTRY      = '0x05d6f66fd849adad3c84c595f444d0713f5a69d450bd84bd350afe560abfead5';
const PROVIDER_GOOGLE    = '0x676f6f676c65'; // felt252 for 'google'

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
    while (newr) {
      const q = r / newr;
      [t, newt] = [newt, t - q * newt];
      [r, newr] = [newr, r - q * newr];
    }
    return t < 0n ? t + m : t;
  };
  const nPrimeVal = (R - modInv(n, R)) % R;
  const rSqVal = (R * R) % n;
  const toLimbs = v => Array.from({ length: 16 }, (_, i) => (v >> (BigInt(i) * 128n)) & ((1n << 128n) - 1n));
  return { nPrime: toLimbs(nPrimeVal), rSq: toLimbs(rSqVal) };
}

function h(v) { return '0x' + v.toString(16); }

// Encode a UTF-8 string as Cairo ByteArray → flat array of felt252 hex strings
// Format: [num_full_words, word0, word1, ..., pending_word, pending_word_len]
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
  let pendingWord = 0n;
  for (let j = 0; j < remaining; j++) pendingWord = pendingWord * 256n + BigInt(bytes[fullWords * 31 + j]);
  result.push('0x' + pendingWord.toString(16));
  result.push('0x' + remaining.toString(16));
  return result;
}

// Parse Ethereum signature: 65-byte hex → flat felt array [r_low, r_high, s_low, s_high, v]
function parseSigToFelts(sigHex) {
  const hex = sigHex.startsWith('0x') ? sigHex.slice(2) : sigHex;
  const r = hexToU256('0x' + hex.slice(0, 64));
  const s = hexToU256('0x' + hex.slice(64, 128));
  const v = parseInt(hex.slice(128, 130), 16);
  return [r.low, r.high, s.low, s.high, '0x' + v.toString(16)];
}

// Encode a 256-bit hex value as u256 { low, high }
function hexToU256(hexStr) {
  const hex = (hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr).padStart(64, '0');
  return {
    low:  '0x' + hex.slice(32),   // last 32 hex chars = low 128 bits
    high: '0x' + hex.slice(0, 32), // first 32 hex chars = high 128 bits
  };
}

// ── Step 1: Generate Reclaim proof ───────────────────────────────────────────
console.log('Step 1: Generating Reclaim zkFetch proof for Google JWKS...');
const client = new ReclaimClient(APP_ID, APP_SECRET);

const proof = await client.zkFetch(
  'https://www.googleapis.com/oauth2/v3/certs',
  { method: 'GET' },
  {
    responseMatches: [
      { type: 'regex', value: '"kid":\\s*"(?<kid>[^"]+)"' },
      { type: 'regex', value: '"n":\\s*"(?<n>[^"]+)"' },
    ],
  }
);

console.log('Proof received!');
console.log(JSON.stringify(proof, null, 2).slice(0, 2000));
console.log('  provider:', proof.claimData.provider);

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
if (alreadyValid) {
  console.log('  Key already on-chain — re-registering anyway to test trustless flow.');
} else {
  console.log('  Not registered yet, proceeding.');
}

// ── Step 4: Build calldata ────────────────────────────────────────────────────
console.log('\nStep 4: Building calldata for register_key...');

// zkFetch proof structure:
//   proof.claimData.{ provider, parameters, context, owner, timestampS, identifier, epoch }
//   proof.identifier  (256-bit hex, same as claimData.identifier)
//   proof.signatures  (array of raw 65-byte hex strings)
const claimData = proof.claimData ?? {};
const identifierHex = claimData.identifier ?? proof.identifier ?? '0x0';

console.log('  identifier:', identifierHex);
console.log('  signatures count:', (proof.signatures ?? []).length);

// Build calldata as flat array — avoids CallData.compile type-inference bugs
// (hex strings starting with 0x would be treated as felt252 instead of ByteArray)
const idU256 = hexToU256(identifierHex);
const sigs = proof.signatures ?? [];

const calldata = [
  // ── Proof ──────────────────────────────────────────────────────────────────
  '0x0',                                            // id: felt252 (unused placeholder)
  // claim_info
  ...encodeByteArray(claimData.provider ?? 'http'), // provider: ByteArray
  ...encodeByteArray(claimData.parameters ?? ''),   // parameters: ByteArray
  ...encodeByteArray(claimData.context ?? ''),      // context: ByteArray
  // signed_claim.claim
  idU256.low, idU256.high,                          // identifier: u256
  ...encodeByteArray(identifierHex),                // byte_identifier: ByteArray ("0x7d01...")
  ...encodeByteArray(claimData.owner ?? ''),        // owner: ByteArray ("0x304...")
  ...encodeByteArray(String(claimData.epoch ?? '1')),       // epoch: ByteArray
  ...encodeByteArray(String(claimData.timestampS ?? '0')),  // timestamp_s: ByteArray
  // signed_claim.signatures (Array<ReclaimSignature>)
  '0x' + sigs.length.toString(16),                 // array length
  ...sigs.flatMap(parseSigToFelts),                 // r_low, r_high, s_low, s_high, v per sig
  // ── kid ────────────────────────────────────────────────────────────────────
  kidFelt,
  // ── JWKSKey ────────────────────────────────────────────────────────────────
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
  PROVIDER_GOOGLE,               // provider: felt252
  h(BigInt(validUntil)),         // valid_until: felt252
  '0x1',                         // is_active: bool
];

console.log('  Calldata length:', calldata.length, 'felts');

// ── Step 5: Submit transaction ────────────────────────────────────────────────
console.log('\nStep 5: Submitting register_key transaction...');

if (!SUBMITTER || !PRIVATE_KEY) {
  console.error('Missing JWKS_SUBMITTER_ADDRESS_SEPOLIA / JWKS_SUBMITTER_PRIVATE_KEY_SEPOLIA in .env.local');
  process.exit(1);
}

const account = new Account({ provider: rpcProvider, address: SUBMITTER, signer: PRIVATE_KEY });

const { transaction_hash } = await account.execute({
  contractAddress: TRUSTLESS_REGISTRY,
  entrypoint: 'register_key',
  calldata,
});

console.log('  Tx submitted:', transaction_hash);
console.log('  Waiting for confirmation...');
await rpcProvider.waitForTransaction(transaction_hash);
console.log('  Confirmed!');

// ── Step 6: Verify on-chain ───────────────────────────────────────────────────
console.log('\nStep 6: Verifying key is now valid on-chain...');
const checkResult = await rpcProvider.callContract({
  contractAddress: JWKS_REGISTRY,
  entrypoint: 'is_key_valid',
  calldata: [kidFelt],
});
const isNowValid = checkResult[0] === '0x1' || checkResult[0] === '1';
console.log('  is_key_valid:', isNowValid ? '✅ YES' : '❌ NO');

if (isNowValid) {
  console.log(`\n✅ Success! Key ${kid} registered trustlessly on Sepolia.`);
} else {
  console.log('\n❌ Key not found on-chain after registration.');
}
