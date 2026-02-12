/**
 * Manual JWKS Sync Endpoint
 * Allows admins to manually trigger JWKS sync for testing or emergencies.
 *
 * POST /api/admin/sync-jwks?network=sepolia
 * Headers: x-admin-key: YOUR_ADMIN_KEY
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncJWKS } from '@/lib/jwks-sync';

// Vercel serverless config
export const maxDuration = 60; // 60 seconds max execution time
export const dynamic = 'force-dynamic'; // Disable caching

export async function POST(request: NextRequest) {
  // Verify admin API key
  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get network from query params
  const network = request.nextUrl.searchParams.get('network') as 'sepolia' | 'mainnet' | null;

  if (!network || !['sepolia', 'mainnet'].includes(network)) {
    return NextResponse.json(
      { error: 'Invalid network. Use ?network=sepolia or ?network=mainnet' },
      { status: 400 }
    );
  }

  console.log(`Manual JWKS sync triggered for ${network}`);
  const startTime = Date.now();

  try {
    const results = await syncJWKS(network);
    const duration = Date.now() - startTime;

    const response = {
      success: true,
      network,
      timestamp: new Date().toISOString(),
      durationMs: duration,
      results: {
        added: results.added,
        skipped: results.skipped.length,
        errors: results.errors,
      },
    };

    console.log(`Manual JWKS sync completed for ${network}:`, JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`Manual JWKS sync failed for ${network}:`, error);
    return NextResponse.json(
      {
        success: false,
        network,
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    },
  });
}
