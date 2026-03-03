// Quick test: generate a Reclaim zkFetch proof for Google JWKS
// Run: node test-reclaim.mjs
import { ReclaimClient } from '@reclaimprotocol/zk-fetch';
import { createRequire } from 'module';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
);

const APP_ID = env['RECLAIM_APP_ID'];
const APP_SECRET = env['RECLAIM_APP_SECRET'];

console.log('APP_ID:', APP_ID);
console.log('Initializing ReclaimClient...');

const client = new ReclaimClient(APP_ID, APP_SECRET);

console.log('Calling zkFetch for Google JWKS...');

try {
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

  console.log('\n=== PROOF RECEIVED ===');
  console.log('proof.claimData.provider:', proof?.claimData?.provider);
  console.log('proof.claimData.context:', proof?.claimData?.context);
  console.log('\nFull proof (first 500 chars):', JSON.stringify(proof).slice(0, 500));
} catch (err) {
  console.error('Error:', err.message ?? err);
}
