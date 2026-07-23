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

/** Exact-match OAuth redirect validation for web, universal links and app schemes. */
export async function validateAppRedirect(appId: string | null, redirectUri: string | null): Promise<string> {
  if (!appId || !redirectUri) throw new Error('Missing app_id or redirect_uri');
  let parsed: URL;
  try { parsed = new URL(redirectUri); }
  catch { throw new Error('Invalid redirect_uri'); }
  if (!parsed.protocol || parsed.username || parsed.password || parsed.hash) {
    throw new Error('Invalid redirect_uri');
  }
  const { data: app, error } = await createAdminClient()
    .from('apps')
    .select('callback_urls,is_active')
    .eq('id', appId)
    .single();
  if (error || !app?.is_active) throw new Error('Invalid app_id');
  if (!(app.callback_urls ?? []).includes(redirectUri)) {
    throw new Error('redirect_uri is not registered for this app');
  }
  return redirectUri;
}
