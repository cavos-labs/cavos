import { createAdminClient } from '@/lib/supabase/admin';

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
