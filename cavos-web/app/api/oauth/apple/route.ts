import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { validateAppRedirect } from '@/lib/oauth/redirects';
import { bindNonceToApp } from '@/lib/oauth/loginNonce';
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier';
import { signOAuthState } from '@/lib/oauth/state';

/**
 * Start an Apple login for an app.
 *
 * Uses Apple's Sign in with Apple directly, so the nonce the provider signs into the
 * id_token is ours to set. It names the app that asked and commits to a secret
 * the client keeps; see lib/oauth/loginNonce.
 *
 * Required env vars:
 * - APPLE_CLIENT_ID: Apple Services ID (e.g., com.yourapp.web)
 * - NEXT_PUBLIC_APP_URL: Base URL for callback
 */

export async function GET(request: NextRequest) {
  try {
    const nonce = request.nextUrl.searchParams.get('nonce');
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const appIdentifier = request.nextUrl.searchParams.get('app_id');
    if (!nonce || !redirectUri || !appIdentifier) {
      return NextResponse.json(
        { error: 'nonce, redirect_uri and app_id are required' },
        { status: 400 }
      );
    }

    // Dashboard-facing IDs are environment public IDs (`cav_…`), while the
    // OAuth callback and database relations use the internal app UUID.
    const resolved = await resolveAppIdentifier(appIdentifier);
    if (!resolved) throw new Error('Invalid app_id');
    const appId = resolved.appId;
    // A token is only ever returned to a redirect the app registered.
    await validateAppRedirect(appId, redirectUri, true);

    // The provider signs this into the id_token; see lib/oauth/loginNonce.
    const boundNonce = bindNonceToApp(appId, nonce);
    if (!boundNonce) {
      return NextResponse.json(
        { error: 'nonce must be the base64url SHA-256 of the login secret' },
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
    const csrfState = randomBytes(16).toString('hex');

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

    url.searchParams.set('nonce', boundNonce);

    // Encode final_redirect_uri and nonce in state for callback to use
    const statePayload = signOAuthState({
      csrf: csrfState,
      redirect_uri: redirectUri,
      // The callback compares the token's nonce against this exact value.
      nonce: boundNonce,
      app_id: appId,
    });
    url.searchParams.set('state', statePayload);

    // Return the URL for the client to redirect to
    return NextResponse.json({ url: url.toString() });
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
