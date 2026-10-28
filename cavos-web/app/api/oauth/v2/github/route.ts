import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { validateAppRedirect } from '@/lib/oauth/redirects';
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier';
import { signOAuthState } from '@/lib/oauth/state';
import { githubCallbackUrl, githubCredentials, isCodeChallenge } from '@/lib/oauth/github';

/**
 * Start a GitHub login for an app.
 *
 * GitHub issues no id_token, so the recovery enclave redeems the code with the
 * PKCE verifier the client keeps and signs the login token itself. This route
 * only builds the authorization URL: the `code_challenge` commits to that
 * verifier, and the signed state binds the flow to the app and environment.
 * No scope is requested; the public profile is enough.
 *
 * Required env vars unless the environment brings its own GitHub OAuth app:
 * - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 * - NEXT_PUBLIC_APP_URL: Base URL for callback
 */

export async function GET(request: NextRequest) {
  try {
    const codeChallenge = request.nextUrl.searchParams.get('code_challenge');
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const appIdentifier = request.nextUrl.searchParams.get('app_id');
    if (!codeChallenge || !redirectUri || !appIdentifier) {
      return NextResponse.json(
        { error: 'code_challenge, redirect_uri and app_id are required' },
        { status: 400 }
      );
    }
    if (!isCodeChallenge(codeChallenge)) {
      return NextResponse.json(
        { error: 'code_challenge must be a base64url SHA-256 digest' },
        { status: 400 }
      );
    }

    const resolved = await resolveAppIdentifier(appIdentifier);
    if (!resolved) throw new Error('Invalid app_id');
    const { appId, environmentId } = resolved;
    await validateAppRedirect(appId, redirectUri, true);

    const { clientId } = await githubCredentials(environmentId ?? null);

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', githubCallbackUrl());
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set(
      'state',
      signOAuthState({
        csrf: randomBytes(16).toString('hex'),
        redirect_uri: redirectUri,
        app_id: appId,
        environment_id: environmentId ?? null,
      })
    );

    return NextResponse.json({ url: url.toString() });
  } catch (error) {
    console.error('[OAUTH-GITHUB] Error:', error);
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
