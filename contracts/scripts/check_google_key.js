const https = require('https');
const kid = '8630a71bd6ec1c61257a27ff2efd91872ecab1f6';

function base64UrlToBytes(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');
  return Buffer.from(base64, 'base64');
}

function bytesToU128Limbs(bytes) {
  const padded = Buffer.alloc(256);
  bytes.copy(padded, 256 - bytes.length);
  const limbs = [];
  for (let i = 15; i >= 0; i--) {
    let limb = 0n;
    for (let j = 0; j < 16; j++) {
      limb = limb * 256n + BigInt(padded[i * 16 + (15 - j)]);
    }
    limbs.unshift(limb.toString());
  }
  return limbs;
}

https.get('https://www.googleapis.com/oauth2/v3/certs', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const jwks = JSON.parse(data);
    const key = jwks.keys.find(k => k.kid === kid);
    if (!key) { 
        console.log('Key not found for kid:', kid); 
        console.log('Available keys:', jwks.keys.map(k => k.kid));
        return; 
    }
    console.log(bytesToU128Limbs(base64UrlToBytes(key.n)));
  });
});
