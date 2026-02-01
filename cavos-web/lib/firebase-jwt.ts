/**
 * Firebase Custom JWT Signing Utility
 *
 * Signs JWTs with RSA-2048 (RS256) for on-chain verification.
 * Format matches Google/Apple JWTs to reuse existing on-chain infrastructure.
 */

import * as jose from 'jose';
import crypto from 'crypto';

/**
 * Signs a custom JWT with RSA-2048 (RS256) for on-chain verification
 * Format matches Google/Apple JWTs
 */
export async function signFirebaseCustomJWT(payload: {
  sub: string;           // Firebase UID
  email?: string;        // User's email (not sent on-chain)
  nonce: string;         // Poseidon(eph_key, max_block, randomness)
  iat: number;           // Issued at
  exp: number;           // Expiry (1 hour)
}): Promise<string> {
  const privateKey = process.env.FIREBASE_RSA_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const kid = process.env.FIREBASE_RSA_KID || 'firebase-2026';

  // Import RSA private key (supports both PKCS#1 and PKCS#8 formats)
  const cryptoKey = crypto.createPrivateKey(privateKey);
  const jwk = cryptoKey.export({ format: 'jwk' }) as jose.JWK;
  const key = await jose.importJWK(jwk, 'RS256');

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({
      alg: 'RS256',
      kid,
      typ: 'JWT'
    })
    .setIssuer('https://cavos.app/firebase')  // Custom issuer
    .setAudience('cavos-starknet')
    .setIssuedAt(payload.iat)
    .setExpirationTime(payload.exp)
    .setSubject(payload.sub)
    .sign(key);

  return jwt;
}

/**
 * Extract RSA modulus and exponent for JWKS endpoint
 */
export async function getFirebaseJWKS() {
  const publicKey = process.env.FIREBASE_RSA_PUBLIC_KEY!.replace(/\\n/g, '\n');
  const kid = process.env.FIREBASE_RSA_KID || 'firebase-2026';

  const key = crypto.createPublicKey(publicKey);
  const jwk = key.export({ format: 'jwk' });

  return {
    keys: [{
      kid,
      kty: 'RSA',
      alg: 'RS256',
      use: 'sig',
      n: jwk.n,  // Base64URL encoded modulus
      e: jwk.e,  // Base64URL encoded exponent
    }]
  };
}
