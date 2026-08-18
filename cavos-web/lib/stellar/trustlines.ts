/**
 * Per-app trustline allowlist — the assets an app's wallets may hold, and so the
 * ones its org's sponsor will pay a reserve for.
 *
 * Keyed on the app rather than the org that pays: wallets are derived per app,
 * so which assets they carry belongs to the product, not to the billing account.
 * See supabase/migrations/20260818223000_stellar_trustlines_per_app.sql.
 */
import { StrKey } from '@stellar/stellar-sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import type { StellarAsset } from './relayer';
import type { StellarNetwork } from './relayer';

/**
 * How many assets one app may configure per network. Each one costs every wallet
 * a base reserve at signup, so the cap is really a cap on what a single
 * misconfiguration can do to the org's pot.
 */
export const MAX_TRUSTLINES_PER_APP = 10;

const ASSET_CODE = /^[A-Za-z0-9]{1,12}$/;

/** Normalise and check one asset, or explain why it is not one. */
export function parseAsset(input: {
  code?: unknown;
  issuer?: unknown;
}): { ok: true; asset: StellarAsset } | { ok: false; reason: string } {
  const code = typeof input.code === 'string' ? input.code.trim() : '';
  const issuer = typeof input.issuer === 'string' ? input.issuer.trim().toUpperCase() : '';
  if (!ASSET_CODE.test(code)) {
    return { ok: false, reason: 'asset code must be 1–12 alphanumeric characters' };
  }
  if (!StrKey.isValidEd25519PublicKey(issuer)) {
    return { ok: false, reason: 'asset issuer must be a valid G address' };
  }
  return { ok: true, asset: { code, issuer } };
}

/** The assets this app sponsors trustlines for on this network. */
export async function listAppTrustlines(
  appId: string,
  network: StellarNetwork,
): Promise<StellarAsset[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('app_stellar_trustlines')
    .select('asset_code, asset_issuer')
    .eq('app_id', appId)
    .eq('network', network);
  if (error) throw new Error(`failed to read stellar trustlines: ${error.message}`);
  return (data ?? []).map((r) => ({ code: r.asset_code, issuer: r.asset_issuer }));
}
