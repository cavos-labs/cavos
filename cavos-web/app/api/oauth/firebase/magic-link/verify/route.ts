/**
 * Magic Link — Verify Route
 *
 * Called when the user clicks the magic link in their email.
 * Verifies the oobCode with Firebase and returns Firebase's own Google-signed
 * ID token. Social recovery verifies that token inside the Nitro enclave
 * against securetoken.google.com; minting a Cavos-signed replacement here would
 * put a second recovery authority outside the enclave.
 */

import { NextRequest } from 'next/server';
import { validateAppRedirect } from '@/lib/oauth/redirects';
import { issueOAuthCallbackCode } from '@/lib/oauth/callback-codes';
import { verifyOAuthState } from '@/lib/oauth/state';

function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function successHtml(jwt: string, uid: string, email: string): string {
  const payload = JSON.stringify({ jwt, uid, email });
  // Escape for safe JS string embedding
  const escaped = payload.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signing you in…</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #0d0d0d;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      max-width: 340px;
      padding: 48px 32px;
    }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(34,197,94,0.12);
      border: 1.5px solid rgba(34,197,94,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    h1 { font-size: 18px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.02em; }
    p  { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0; line-height: 1.55; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <polyline points="20 6 9 17 4 12" stroke="#22c55e" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h1>You're signed in</h1>
    <p>You can close this tab and return to the app.</p>
  </div>
  <script>
    try {
      localStorage.setItem('cavos_auth_result', '${escaped}');
    } catch (e) {}
    try { window.close(); } catch (e) {}
  </script>
</body>
</html>`;
}

function errorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign-in failed</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #0d0d0d;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card { max-width: 340px; padding: 48px 32px; }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(239,68,68,0.1);
      border: 1.5px solid rgba(239,68,68,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    h1 { font-size: 18px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.02em; }
    p  { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0; line-height: 1.55; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    </div>
    <h1>Link expired or already used</h1>
    <p>${message} Go back to the app and request a new link.</p>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let email          = searchParams.get('email');
  const oobCode      = searchParams.get('oobCode');
  let nonce          = searchParams.get('nonce');
  let app_id         = searchParams.get('app_id');
  let redirect_uri   = searchParams.get('redirect_uri');
  let callbackMode: 'legacy' | 'code' = 'legacy';
  const callbackState = searchParams.get('callback_state');

  if (callbackState) {
    try {
      const state = verifyOAuthState<{
        email: string;
        nonce: string;
        app_id: string;
        redirect_uri?: string | null;
        callback_mode?: 'legacy' | 'code';
        issued_at?: number;
      }>(callbackState, 60 * 60_000);
      email = state.email;
      nonce = state.nonce;
      app_id = state.app_id;
      redirect_uri = state.redirect_uri ?? null;
      callbackMode = state.callback_mode === 'code' ? 'code' : 'legacy';
    } catch {
      return htmlResponse(errorHtml('Invalid or expired link.'));
    }
  }

  if (!email || !oobCode || !nonce || !app_id) {
    return htmlResponse(errorHtml('Invalid or incomplete link.'));
  }

  // Verify oobCode with Firebase REST API — handles expiry and one-time use atomically
  const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink?key=${process.env.FIREBASE_API_KEY}`;

  let localId: string;
  let verifiedEmail: string;
  let jwt: string;

  try {
    const res = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, oobCode }),
    });

    if (!res.ok) {
      const body = await res.json();
      const code = body?.error?.message || 'UNKNOWN';
      console.error(`[MagicLink] Firebase verification failed (${code}) for ${email}`);

      const message =
        code === 'INVALID_OOB_CODE'     ? 'This link has already been used.' :
        code === 'EXPIRED_OOB_CODE'     ? 'This link has expired.' :
        code.includes('EMAIL_NOT_FOUND') ? 'No account found for this email.' :
        'This link is invalid.';

      return htmlResponse(errorHtml(message));
    }

    const data = await res.json();
    localId       = data.localId;
    verifiedEmail = data.email ?? email;
    jwt           = data.idToken;
    if (!jwt) {
      console.error('[MagicLink] Firebase response omitted idToken');
      return htmlResponse(errorHtml('Could not complete sign-in.'));
    }
  } catch (err) {
    console.error('[MagicLink] Firebase REST call failed:', err);
    return htmlResponse(errorHtml('Could not verify the link.'));
  }

  console.log(`[MagicLink] Verified Firebase ID token for ${verifiedEmail} (uid: ${localId})`);

  // Redirect with a short-lived one-time code — never the Firebase JWT.
  if (redirect_uri) {
    try {
      await validateAppRedirect(app_id, redirect_uri, callbackMode === 'code');
      const dest = new URL(redirect_uri);
      if (callbackMode === 'code') {
        const callbackCode = await issueOAuthCallbackCode({
          appId: app_id,
          redirectUri: redirect_uri,
          payload: { jwt },
        });
        dest.searchParams.set('cavos_auth_code', callbackCode);
      } else {
        dest.searchParams.set('auth_data', JSON.stringify({ jwt }));
      }
      return new Response(null, {
        status: 302,
        headers: {
          Location: dest.toString(),
          'Cache-Control': 'no-store',
          'Referrer-Policy': 'no-referrer',
        },
      });
    } catch {
      // Fall through to HTML response if redirect_uri is malformed
    }
  }

  return htmlResponse(successHtml(jwt, localId, verifiedEmail));
}
