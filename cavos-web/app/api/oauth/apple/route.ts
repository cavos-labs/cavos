import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

/**
 * Direct Apple OAuth initiation for ZK Login
 *
 * This route uses Apple's Sign in with Apple directly,
 * allowing us to pass a custom nonce that will be embedded in the id_token.
 * The nonce is computed by the client as: Poseidon(eph_pubkey, max_block, randomness)
 *
 * Required env vars:
 * - APPLE_CLIENT_ID: Apple Services ID (e.g., com.yourapp.web)
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

    const appleClientId = process.env.APPLE_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!appleClientId) {
      return NextResponse.json(
        { error: 'Apple OAuth configuration missing. Set APPLE_CLIENT_ID env var.' },
        { status: 500 }
      );
    }

    // Generate CSRF state if not provided
    const csrfState = state || randomBytes(16).toString('hex');

    // Build callback URL
    const callbackUrl = `${baseUrl}/api/oauth/apple/callback`;

    // Build Apple OAuth authorization URL
    // https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms
    const url = new URL('https://appleid.apple.com/auth/authorize');

    url.searchParams.set('client_id', appleClientId);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code id_token');
    url.searchParams.set('response_mode', 'form_post'); // Apple requires form_post for id_token
    url.searchParams.set('scope', 'name email');

    // CRITICAL: Pass nonce - this will be embedded in the id_token
    // Apple hashes the nonce before embedding it, so we need to handle this
    // Note: Apple uses SHA256(nonce) in the id_token
    url.searchParams.set('nonce', nonce);

    // Encode final_redirect_uri and nonce in state for callback to use
    const statePayload = JSON.stringify({
      csrf: csrfState,
      redirect_uri: redirectUri,
      nonce: nonce, // Original nonce for verification
    });
    url.searchParams.set('state', Buffer.from(statePayload).toString('base64url'));

    // Return the URL for the client to redirect to
    return NextResponse.json(
      { url: url.toString() },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error: any) {
    console.error('[OAUTH-APPLE] Error:', error);
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

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
