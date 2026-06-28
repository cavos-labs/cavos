/**
 * App-scoped Solana program allowlist helpers. Backs the per-app
 * `allowed_solana_programs` column (set in the dashboard) that the sponsored
 * relayer reads to decide which CPI targets it will co-sign for `execute`.
 */
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Read the app's configured Solana program allowlist. Returns [] when unset or
 * the app is missing — the relayer then falls back to the always-safe CPI set.
 * Uses the service-role client (this runs server-side in the relay path).
 */
export async function resolveSolanaProgramAllowlist(appId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('apps')
    .select('allowed_solana_programs')
    .eq('id', appId)
    .single();
  const list = data?.allowed_solana_programs;
  return Array.isArray(list) ? list.filter((p): p is string => typeof p === 'string') : [];
}
