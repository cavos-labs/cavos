import { NextRequest, NextResponse } from 'next/server';
import { validateAppRedirect } from '@/lib/oauth/redirects';
import { issueOAuthCallbackCode } from '@/lib/oauth/callback-codes';
import { verifyOAuthState } from '@/lib/oauth/state';

/**
 * Direct Google OAuth callback for ZK Login
 *
 * This route handles the OAuth callback from Google, exchanges the code for tokens,
 * and returns the id_token (JWT) which contains the nonce.
 *
 * The id_token will have:
 * - iss: "https://accounts.google.com"
 * - sub: unique user ID (used for address_seed derivation)
 * - email: user's email
 * - nonce: the Poseidon hash we passed in the auth request
 *
 * Required env vars:
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - NEXT_PUBLIC_APP_URL: Base URL for callback
 */

interface StatePayload {
  csrf: string;
  redirect_uri: string;
  nonce: string;
  app_id?: string | null;
  issued_at?: number;
  callback_mode?: 'legacy' | 'code';
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const stateParam = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = request.nextUrl.searchParams.get('error_description');
      console.error('[OAUTH-GOOGLE-CALLBACK] OAuth error:', error, errorDescription);
      return NextResponse.json(
        { error: `OAuth error: ${error}`, details: errorDescription },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    if (!stateParam) {
      return NextResponse.json(
        { error: 'Missing state parameter' },
        { status: 400 }
      );
    }

    // Decode state payload
    let statePayload: StatePayload;
    try {
      statePayload = verifyOAuthState<StatePayload>(stateParam);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    const { redirect_uri: finalRedirectUri, nonce: expectedNonce, app_id: appId } = statePayload;
    const callbackMode = statePayload.callback_mode === 'code' ? 'code' : 'legacy';

    if (!finalRedirectUri) {
      return NextResponse.json(
        { error: 'Missing redirect_uri in state' },
        { status: 400 }
      );
    }
    if (callbackMode === 'code' && !appId) throw new Error('Secure OAuth requires app_id');
    await validateAppRedirect(appId, finalRedirectUri, callbackMode === 'code');

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!googleClientId || !googleClientSecret) {
      return NextResponse.json(
        { error: 'Google OAuth configuration missing' },
        { status: 500 }
      );
    }

    // Exchange code for tokens
    // https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: `${baseUrl}/api/oauth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[OAUTH-GOOGLE-CALLBACK] Token exchange failed:', errorData);
      return NextResponse.json(
        { error: 'Token exchange failed', details: errorData },
        { status: 400 }
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Decode and verify the id_token (JWT)
    // Note: In production, you should verify the signature using Google's public keys
    const idTokenParts = tokens.id_token.split('.');
    if (idTokenParts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid id_token format' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(Buffer.from(idTokenParts[1], 'base64url').toString('utf-8'));

    // Verify the nonce matches what we sent
    if (payload.nonce !== expectedNonce) {
      console.error('[OAUTH-GOOGLE-CALLBACK] Nonce mismatch:', {
        expected: expectedNonce,
        received: payload.nonce,
      });
      return NextResponse.json(
        { error: 'Nonce mismatch - possible replay attack' },
        { status: 400 }
      );
    }

    // Verify issuer
    if (payload.iss !== 'https://accounts.google.com') {
      return NextResponse.json(
        { error: 'Invalid token issuer' },
        { status: 400 }
      );
    }

    // Verify audience
    if (payload.aud !== googleClientId) {
      return NextResponse.json(
        { error: 'Invalid token audience' },
        { status: 400 }
      );
    }

    // Store the JWT encrypted for two minutes and redirect with only a random,
    // one-time authorization code. Provider refresh/access tokens are discarded.
    const redirectUrl = new URL(finalRedirectUri);
    if (callbackMode === 'code' && appId) {
      const callbackCode = await issueOAuthCallbackCode({
        appId,
        redirectUri: finalRedirectUri,
        payload: { jwt: tokens.id_token },
      });
      redirectUrl.searchParams.set('cavos_auth_code', callbackCode);
    } else {
      // v1 compatibility for already-deployed SDKs. No access or refresh token
      // is included; only the JWT shape old clients already require.
      redirectUrl.searchParams.set('auth_data', JSON.stringify({ jwt: tokens.id_token }));
    }

    console.log('[OAUTH-GOOGLE-CALLBACK] Success for user:', payload.sub);

    const response = NextResponse.redirect(redirectUrl.toString());
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (error: any) {
    console.error('[OAUTH-GOOGLE-CALLBACK] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
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
