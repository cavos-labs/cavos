const https = require('https');

function base64UrlToBytes(base64url) {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');

  const binary = Buffer.from(base64, 'base64');
  return new Uint8Array(binary);
}

function bytesToU128Limbs(bytes) {
  const padded = new Uint8Array(256);
  padded.set(bytes, 256 - bytes.length);

  const limbs = [];
  for (let i = 15; i >= 0; i--) {
    let limb = 0n;
    for (let j = 0; j < 16; j++) {
      const byteIdx = i * 16 + j;
      limb = limb * 256n + BigInt(padded[byteIdx]);
    }
    limbs.push(limb.toString());
  }
  return limbs;
}

function kidToFelt(kid) {
  const bytes = Buffer.from(kid, 'utf8');
  let felt = 0n;
  for (let i = 0; i < bytes.length && i < 31; i++) {
    felt = felt * 256n + BigInt(bytes[i]);
  }
  return felt.toString();
}

https.get('https://www.googleapis.com/oauth2/v3/certs', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const jwks = JSON.parse(data);
    const GOOGLE_PROVIDER = '0x676f6f676c65';
    const VALID_UNTIL = '0';
    const IS_ACTIVE = '1';

    const results = [];
    for (const key of jwks.keys) {
      if (key.kty !== 'RSA' || key.alg !== 'RS256') continue;
      const nBytes = base64UrlToBytes(key.n);
      const nLimbs = bytesToU128Limbs(nBytes);
      const kidFelt = kidToFelt(key.kid);
      const calldata = [kidFelt, ...nLimbs, GOOGLE_PROVIDER, VALID_UNTIL, IS_ACTIVE];
      results.push({ kid: key.kid, calldata: calldata.join(' ') });
    }
    console.log(JSON.stringify(results));
  });
}).on('error', (err) => {
  console.error(err);
  process.exit(1);
});
