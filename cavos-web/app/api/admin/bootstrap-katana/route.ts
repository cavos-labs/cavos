/**
 * Katana bootstrap endpoint.
 *
 * Makes a fresh Katana ready to run Cavos: declares classes, deploys the parity
 * JWKS registries + their admin accounts, and loads Google/Apple/Cavos JWKS.
 * Idempotent — safe to re-run. Cavos admin private keys stay server-side (env);
 * the caller only supplies the target Katana RPC and a funded operator on it.
 *
 * POST /api/admin/bootstrap-katana
 * Headers: x-admin-key: ADMIN_API_KEY
 * Body: { rpcUrl, operatorAddress, operatorPrivateKey, sourceRpcUrl? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { bootstrapKatana } from '@/lib/katana-bootstrap';

export const maxDuration = 300; // declaring + deploying can take a couple minutes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { rpcUrl, operatorAddress, operatorPrivateKey, sourceRpcUrl } = body || {};
  const missing = ['rpcUrl', 'operatorAddress', 'operatorPrivateKey'].filter((k) => !body?.[k]);
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  const startTime = Date.now();
  try {
    const result = await bootstrapKatana({
      rpcUrl,
      operatorAddress,
      operatorPrivateKey,
      sourceRpcUrl,
    });

    const allVerified = result.registries.every(
      (r) => r.verified.google && r.verified.apple && r.verified.cavos
    );

    return NextResponse.json({
      success: allVerified,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    console.error('Katana bootstrap failed:', error);
    return NextResponse.json(
      {
        success: false,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

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
