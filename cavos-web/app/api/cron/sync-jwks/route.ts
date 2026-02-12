/**
 * JWKS Sync Cron Endpoint
 * Runs every 6 hours via Vercel Cron to sync Google/Apple JWKS keys on-chain.
 *
 * Schedule: 0 *\/6 * * * (every 6 hours)
 * Protected by CRON_SECRET header verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllNetworks } from '@/lib/jwks-sync';

// Vercel serverless config
export const maxDuration = 60; // 60 seconds max execution time
export const dynamic = 'force-dynamic'; // Disable caching

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  // Vercel automatically sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.error('Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('Starting scheduled JWKS sync...');
  const startTime = Date.now();

  try {
    const results = await syncAllNetworks();
    const duration = Date.now() - startTime;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: duration,
      results: {
        sepolia: {
          added: results.sepolia.added,
          skipped: results.sepolia.skipped.length,
          errors: results.sepolia.errors,
        },
        mainnet: {
          added: results.mainnet.added,
          skipped: results.mainnet.skipped.length,
          errors: results.mainnet.errors,
        },
      },
    };

    console.log('JWKS sync completed:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('JWKS sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}
