import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { validateAppRedirect } from '@/lib/oauth/redirects';
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier';
import { signOAuthState } from '@/lib/oauth/state';
import { isCodeChallenge } from '@/lib/oauth/github';
import { telegramAuthorizationUrl, telegramCredentials } from '@/lib/oauth/telegram';
import { bindNonceToApp } from '@/lib/oauth/loginNonce';

/**
 * Start a Telegram login for an app.
 *
 * Telegram's OIDC id_token is not accepted directly: the recovery enclave
 * redeems the code with the PKCE verifier the client keeps and signs the login
 * token itself. This route only builds the authorization URL: the
 * `code_challenge` commits to that verifier, the `nonce` carries the app and the
 * client's login hash, and the signed state binds the flow to the app and
 * environment. Only the `openid profile` scope is requested.
 *
 * Required env vars unless the environment brings its own Telegram bot:
 * - TELEGRAM_BOT_ID, TELEGRAM_CLIENT_SECRET
 * - NEXT_PUBLIC_APP_URL: Base URL for callback
 */

const CLIENT_NONCE = /^[A-Za-z0-9_-]{43}$/;

export async function GET(request: NextRequest) {
  try {
    const codeChallenge = request.nextUrl.searchParams.get('code_challenge');
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const appIdentifier = request.nextUrl.searchParams.get('app_id');
    const clientNonce = request.nextUrl.searchParams.get('nonce');
    if (!codeChallenge || !redirectUri || !appIdentifier || !clientNonce) {
      return NextResponse.json(
        { error: 'code_challenge, redirect_uri, app_id and nonce are required' },
        { status: 400 }
      );
    }
    if (!isCodeChallenge(codeChallenge)) {
      return NextResponse.json(
        { error: 'code_challenge must be a base64url SHA-256 digest' },
        { status: 400 }
      );
    }
    if (!CLIENT_NONCE.test(clientNonce)) {
      return NextResponse.json(
        { error: 'nonce must be a base64url SHA-256 digest' },
        { status: 400 }
      );
    }

    const resolved = await resolveAppIdentifier(appIdentifier);
    if (!resolved) throw new Error('Invalid app_id');
    const { appId, environmentId } = resolved;
    await validateAppRedirect(appId, redirectUri, true);

    const nonce = bindNonceToApp(appId, clientNonce);
    if (!nonce) {
      return NextResponse.json(
        { error: 'nonce must be a base64url SHA-256 digest' },
        { status: 400 }
      );
    }

    const { botId } = await telegramCredentials(environmentId ?? null);

    const url = telegramAuthorizationUrl({
      botId,
      codeChallenge,
      nonce,
      state: signOAuthState({
        csrf: randomBytes(16).toString('hex'),
        redirect_uri: redirectUri,
        app_id: appId,
        environment_id: environmentId ?? null,
      }),
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[OAUTH-TELEGRAM] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
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
