/**
 * JWKS Apple Endpoint
 * Fetches Apple's current RSA public keys and formats them for on-chain submission
 * to the JWKS Registry contract.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CallData, byteArray, hash } from 'starknet';

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

interface JWK {
  kty: string;
  alg: string;
  use: string;
  kid: string;
  n: string;
  e: string;
}

interface AppleJWKS {
  keys: JWK[];
}

/**
 * Convert Base64URL to bytes
 */
function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert bytes to 17 x 123-bit proof limbs (little-endian).
 */
function bytesToProofLimbs(bytes: Uint8Array): string[] {
  // Pad to 256 bytes if needed
  const padded = new Uint8Array(256);
  padded.set(bytes, 256 - bytes.length);

  let modulus = 0n;
  for (const byte of padded) {
    modulus = (modulus << 8n) + BigInt(byte);
  }

  const mask = (1n << 123n) - 1n;
  const limbs: string[] = [];
  for (let i = 0; i < 17; i++) {
    limbs.push('0x' + ((modulus >> (BigInt(i) * 123n)) & mask).toString(16));
  }
  return limbs;
}

/**
 * Convert a JWK to format suitable for on-chain storage
 */
function formatKeyForContract(key: JWK): {
  kid: string;
  n: string[];
  e: string;
  provider: string;
} {
  // Decode the modulus (n) from Base64URL
  const nBytes = base64UrlToBytes(key.n);
  const nLimbs = bytesToProofLimbs(nBytes);

  // Decode the exponent (e) - usually 65537 (AQAB in Base64)
  const eBytes = base64UrlToBytes(key.e);
  let e = 0n;
  for (const b of eBytes) {
    e = e * 256n + BigInt(b);
  }

  return {
    kid: hash.computePoseidonHashOnElements(
      CallData.compile(byteArray.byteArrayFromString(key.kid))
    ),
    n: nLimbs,
    e: '0x' + e.toString(16),
    provider: '0x6170706c65', // 'apple' as felt252
  };
}

export async function GET(request: NextRequest) {
  try {
    // Fetch Apple's current JWKS
    const response = await fetch(APPLE_JWKS_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Apple JWKS: ${response.statusText}`);
    }

    const jwks: AppleJWKS = await response.json();

    // Filter and format RSA keys only
    const formattedKeys = jwks.keys
      .filter(key => key.kty === 'RSA' && key.alg === 'RS256')
      .map(formatKeyForContract);

    return NextResponse.json({
      success: true,
      keys: formattedKeys,
      metadata: {
        provider: 'apple',
        fetchedAt: new Date().toISOString(),
        keyCount: formattedKeys.length,
      },
      // Include raw JWKS for reference
      raw: jwks,
    });
  } catch (error: any) {
    console.error('Error fetching Apple JWKS:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
