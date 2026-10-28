import { NextRequest, NextResponse } from 'next/server';
import { validateAppRedirect } from '@/lib/oauth/redirects';
import { issueOAuthCallbackCode } from '@/lib/oauth/callback-codes';
import { signOAuthState, verifyOAuthState } from '@/lib/oauth/state';

/**
 * GitHub OAuth callback.
 *
 * This route never calls GitHub: it lacks the PKCE verifier, so it could not
 * redeem the code even if it tried. It wraps the code in an HMAC-signed grant
 * bound to the app and environment, stores that grant behind a one-time
 * callback code, and redirects. The client later hands the grant to
 * `/api/oauth/github/verify`, which forwards it to the recovery enclave. The
 * authorization code is never logged.
 */

interface StatePayload {
  csrf: string;
  redirect_uri: string;
  app_id?: string | null;
  environment_id?: string | null;
  issued_at?: number;
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const stateParam = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');

    if (error) {
      const errorDescription = request.nextUrl.searchParams.get('error_description');
      console.error('[OAUTH-GITHUB-CALLBACK] OAuth error:', error, errorDescription);
      return NextResponse.json(
        { error: `OAuth error: ${error}`, details: errorDescription },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    if (!stateParam) {
      return NextResponse.json({ error: 'Missing state parameter' }, { status: 400 });
    }

    let statePayload: StatePayload;
    try {
      statePayload = verifyOAuthState<StatePayload>(stateParam);
    } catch {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const { redirect_uri: finalRedirectUri, app_id: appId, environment_id: environmentId } = statePayload;

    if (!finalRedirectUri) {
      return NextResponse.json({ error: 'Missing redirect_uri in state' }, { status: 400 });
    }
    if (!appId) throw new Error('OAuth state names no app');
    await validateAppRedirect(appId, finalRedirectUri, true);

    const redirectUrl = new URL(finalRedirectUri);
    const callbackCode = await issueOAuthCallbackCode({
      appId,
      redirectUri: finalRedirectUri,
      payload: {
        github_grant: signOAuthState({
          code,
          app_id: appId,
          environment_id: environmentId ?? null,
        }),
      },
    });
    redirectUrl.searchParams.set('cavos_auth_code', callbackCode);

    const response = NextResponse.redirect(redirectUrl.toString());
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (error) {
    console.error('[OAUTH-GITHUB-CALLBACK] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
