/**
 * Cavos Firebase JWKS Endpoint (public, standard format)
 *
 * Serves the Cavos Firebase RSA public key in standard JWKS format.
 * Used by Reclaim Protocol's zkFetch to generate trustless proofs
 * that Argus verifies on-chain via CAVOS_FIREBASE_JWKS_URL_HASH.
 *
 * Direct URL:    https://cavos.xyz/api/jwks/cavos-firebase
 * Discovery URL: https://cavos.xyz/.well-known/jwks.json  (via next.config.ts rewrite)
 *
 * Format: {"keys": [...]} — standard JWKS, Reclaim-parseable via regex on kid and n.
 */

import { NextResponse } from 'next/server';
import { getFirebaseJWKS } from '@/lib/firebase-jwt';

export async function GET() {
  try {
    const jwks = await getFirebaseJWKS();

    // Return pure standard JWKS format — no extra fields that break Reclaim regex
    return NextResponse.json(jwks, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('[cavos-firebase JWKS] error:', error);
    return NextResponse.json({ error: 'Failed to fetch JWKS' }, { status: 500 });
  }
}
