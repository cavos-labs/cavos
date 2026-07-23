import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Back-compat shim: older `@cavos/react` clients (< 1.1.19) start OAuth without
 * an `app_id`. Recover it from the `redirect_uri` by finding the active app that
 * has this exact URL registered as a callback. Only returns an id when the match
 * is unambiguous (exactly one app) — otherwise null, so the caller still rejects.
 */
export async function resolveAppIdForRedirect(redirectUri: string | null): Promise<string | null> {
  if (!redirectUri) return null;
  const { data, error } = await createAdminClient()
    .from('apps')
    .select('id')
    .eq('is_active', true)
    .contains('callback_urls', [redirectUri]);
  if (error || !data || data.length !== 1) return null;
  return data[0].id as string;
}

/**
 * OAuth redirect validation for web, universal links and app schemes.
 *
 * Backward-compatible posture: the exact-match callback allowlist is **opt-in**.
 * - No `app_id` (older SDK clients) → basic URL sanity only, as before app_id
 *   was threaded through the flow.
 * - `app_id` present but the app has no `callback_urls` configured → allowed.
 * - `app_id` present and `callback_urls` configured → enforce exact match.
 *
 * This lets apps that register callbacks in the console lock the flow down,
 * without breaking every app that hasn't (all of them, today).
 */
export async function validateAppRedirect(appId: string | null | undefined, redirectUri: string | null): Promise<string> {
  if (!redirectUri) throw new Error('Missing redirect_uri');
  let parsed: URL;
  try { parsed = new URL(redirectUri); }
  catch { throw new Error('Invalid redirect_uri'); }
  if (!parsed.protocol || parsed.username || parsed.password || parsed.hash) {
    throw new Error('Invalid redirect_uri');
  }
  // No app to scope against → sanity-checked URL is enough (pre-app_id behavior).
  if (!appId) return redirectUri;

  const { data: app, error } = await createAdminClient()
    .from('apps')
    .select('callback_urls,is_active')
    .eq('id', appId)
    .single();
  if (error || !app?.is_active) throw new Error('Invalid app_id');
  const allowlist = app.callback_urls ?? [];
  // Only enforce when the app has actually registered callbacks.
  if (allowlist.length > 0 && !allowlist.includes(redirectUri)) {
    throw new Error('redirect_uri is not registered for this app');
  }
  return redirectUri;
}
