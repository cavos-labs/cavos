import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

/**
 * Direct Google OAuth initiation for ZK Login
 *
 * This route bypasses Auth0 and uses Google OAuth directly,
 * allowing us to pass a custom nonce that will be embedded in the id_token.
 * The nonce is computed by the client as: Poseidon(eph_pubkey, max_block, randomness)
 *
 * Required env vars:
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - NEXT_PUBLIC_APP_URL: Base URL for callback
 */

export async function GET(request: NextRequest) {
  try {
    const nonce = request.nextUrl.searchParams.get('nonce');
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const state = request.nextUrl.searchParams.get('state');

    // Validate required parameters
    if (!nonce) {
      return NextResponse.json(
        { error: 'Missing nonce parameter. Client must compute nonce = Poseidon(eph_pubkey, max_block, randomness)' },
        { status: 400 }
      );
    }

    if (!redirectUri) {
      return NextResponse.json(
        { error: 'Missing redirect_uri parameter' },
        { status: 400 }
      );
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!googleClientId) {
      return NextResponse.json(
        { error: 'Google OAuth configuration missing. Set GOOGLE_CLIENT_ID env var.' },
        { status: 500 }
      );
    }

    // Generate CSRF state if not provided
    const csrfState = state || randomBytes(16).toString('hex');

    // Build callback URL - we'll embed the final redirect URI and state
    const callbackUrl = `${baseUrl}/api/oauth/google/callback`;

    // Build Google OAuth authorization URL
    // https://developers.google.com/identity/protocols/oauth2/web-server
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

    url.searchParams.set('client_id', googleClientId);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('access_type', 'offline'); // Get refresh token
    url.searchParams.set('prompt', 'consent'); // Force consent to get refresh token

    // CRITICAL: Pass nonce - this will be embedded in the id_token
    // The ZK circuit will verify this nonce matches hash(eph_pubkey, max_block, randomness)
    url.searchParams.set('nonce', nonce);

    // Encode final_redirect_uri and nonce in state for callback to use
    const statePayload = JSON.stringify({
      csrf: csrfState,
      redirect_uri: redirectUri,
      nonce: nonce, // Pass nonce through state for verification in callback
    });
    url.searchParams.set('state', Buffer.from(statePayload).toString('base64url'));

    // Return the URL for the client to redirect to
    return NextResponse.json({ url: url.toString() });
  } catch (error: any) {
    console.error('[OAUTH-GOOGLE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

