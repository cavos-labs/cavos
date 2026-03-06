/**
 * Firebase JWKS Endpoint
 *
 * Returns Firebase RSA public keys in JWKS format
 * Used by SDK to verify JWTs client-side and by on-chain contracts
 */

import { NextResponse } from 'next/server';
import { getFirebaseJWKS } from '@/lib/firebase-jwt';

export async function GET() {
  try {
    const jwks = await getFirebaseJWKS();

    // Also convert to contract format (17 x 123-bit proof limbs)
    const contractFormat = await convertToContractFormat(jwks.keys[0]);

    return NextResponse.json({
      jwks,           // Standard JWKS format
      contract: contractFormat,  // Cairo contract format
    });
  } catch (error: any) {
    console.error('JWKS fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch JWKS' },
      { status: 500 }
    );
  }
}

async function convertToContractFormat(key: any) {
  // Convert base64url to hex
  const nBuf = Buffer.from(key.n, 'base64url');
  const eBuf = Buffer.from(key.e, 'base64url');

  // Convert to BigInt
  const n = BigInt('0x' + nBuf.toString('hex'));
  const e = BigInt('0x' + eBuf.toString('hex'));

  // Split into 17 x 123-bit proof limbs (little-endian)
  const limbs: string[] = [];
  const mask = (1n << 123n) - 1n;
  for (let i = 0; i < 17; i++) {
    const shift = BigInt(i * 123);
    const limb = (n >> shift) & mask;
    limbs.push('0x' + limb.toString(16));
  }

  return {
    kid: key.kid,
    modulus_limbs: limbs,
    exponent: '0x' + e.toString(16),
    provider: 'firebase',
  };
}
