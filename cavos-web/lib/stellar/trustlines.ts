/**
 * Per-org trustline allowlist — the assets an org's sponsor will pay a reserve
 * for. See supabase/migrations/20260818210000_stellar_org_trustlines.sql.
 */
import { StrKey } from '@stellar/stellar-sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import type { StellarAsset } from './relayer';
import type { StellarNetwork } from './relayer';

/**
 * How many assets one org may configure per network. Each one costs every wallet
 * a base reserve at signup, so the cap is really a cap on what a single
 * misconfiguration can do to the org's pot.
 */
export const MAX_TRUSTLINES_PER_ORG = 10;

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

/** The assets this org sponsors trustlines for on this network. */
export async function listOrgTrustlines(
  orgId: string,
  network: StellarNetwork,
): Promise<StellarAsset[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('org_stellar_trustlines')
    .select('asset_code, asset_issuer')
    .eq('org_id', orgId)
    .eq('network', network);
  if (error) throw new Error(`failed to read stellar trustlines: ${error.message}`);
  return (data ?? []).map((r) => ({ code: r.asset_code, issuer: r.asset_issuer }));
}
