import { NextRequest, NextResponse } from 'next/server';
import { validateAppRedirect } from '@/lib/oauth/redirects';
import { issueOAuthCallbackCode } from '@/lib/oauth/callback-codes';
import { signOAuthState } from '@/lib/oauth/state';
import { openTelegramState, registeredRedirect, type TelegramState } from '@/lib/oauth/telegramState';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Telegram OAuth callback.
 *
 * This route never calls Telegram: it lacks the PKCE verifier, so it could not
 * redeem the code even if it tried. It wraps the code in an HMAC-signed grant
 * bound to the app and environment, stores that grant behind a one-time
 * callback code, and redirects. The client later hands the grant to
 * `/api/oauth/telegram/verify`, which forwards it to the recovery enclave. The
 * authorization code is never logged.
 *
 * The state names the redirect only by digest (Telegram caps `state` at 256
 * characters), so the redirect is the app's registered callback with that
 * digest. The login could only start with a registered callback, so there is
 * always exactly one.
 */

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const stateParam = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');

    if (error) {
      const errorDescription = request.nextUrl.searchParams.get('error_description');
      console.error('[OAUTH-TELEGRAM-CALLBACK] OAuth error:', error, errorDescription);
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

    let state: TelegramState;
    try {
      state = openTelegramState(stateParam);
    } catch {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }
    const { appId, environmentId } = state;

    const { data: app, error: appError } = await createAdminClient()
      .from('apps')
      .select('callback_urls,is_active')
      .eq('id', appId)
      .single();
    if (appError || !app?.is_active) throw new Error('Invalid app_id');
    const finalRedirectUri = registeredRedirect(app.callback_urls ?? [], state.redirectDigest);
    if (!finalRedirectUri) {
      return NextResponse.json({ error: 'redirect_uri is not registered for this app' }, { status: 400 });
    }
    await validateAppRedirect(appId, finalRedirectUri, true);

    const redirectUrl = new URL(finalRedirectUri);
    const callbackCode = await issueOAuthCallbackCode({
      appId,
      redirectUri: finalRedirectUri,
      payload: {
        telegram_grant: signOAuthState({
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
    console.error('[OAUTH-TELEGRAM-CALLBACK] Error:', error);
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
