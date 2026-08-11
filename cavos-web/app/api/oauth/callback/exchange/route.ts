import { NextRequest, NextResponse } from 'next/server';
import { consumeOAuthCallbackCode } from '@/lib/oauth/callback-codes';
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier';
import { validateAppRedirect } from '@/lib/oauth/redirects';

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    Vary: 'Origin',
  };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  try {
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code : '';
    const appIdentifier = typeof body.app_id === 'string' ? body.app_id : '';
    const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri : '';
    if (!/^[A-Za-z0-9_-]{43}$/.test(code) || !appIdentifier || !redirectUri) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers });
    }

    const resolved = await resolveAppIdentifier(appIdentifier);
    if (!resolved) return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers });
    await validateAppRedirect(resolved.appId, redirectUri, true);

    const target = new URL(redirectUri);
    if ((target.protocol === 'http:' || target.protocol === 'https:') && origin !== target.origin) {
      return NextResponse.json({ error: 'origin_mismatch' }, { status: 403, headers });
    }

    const payload = await consumeOAuthCallbackCode({
      code,
      appId: resolved.appId,
      redirectUri,
    });
    if (!payload) {
      return NextResponse.json({ error: 'invalid_or_expired_code' }, { status: 400, headers });
    }
    return NextResponse.json(payload, { headers });
  } catch (error) {
    console.error('[OAUTH-CALLBACK-EXCHANGE] Failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'callback_exchange_failed' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
