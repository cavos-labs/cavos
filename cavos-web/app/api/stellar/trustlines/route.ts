/**
 * GET    /api/stellar/trustlines?org_id=&network=   → the org's allowlist
 * POST   /api/stellar/trustlines  { org_id, network?, code, issuer }
 * DELETE /api/stellar/trustlines  { org_id, network?, code, issuer }
 *
 * The assets an org's sponsor will pay a trustline reserve for. Org owners only;
 * the relay reads the same rows through the service role.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupportedStellarNetwork } from '@/lib/stellar/relayer';
import {
  MAX_TRUSTLINES_PER_ORG,
  listOrgTrustlines,
  parseAsset,
} from '@/lib/stellar/trustlines';

/** Authenticate, and confirm the caller owns the org they named. */
async function requireOwnedOrg(orgId: unknown) {
  if (typeof orgId !== 'string' || !orgId) {
    return { error: NextResponse.json({ error: 'org_id is required' }, { status: 400 }) };
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', orgId)
    .eq('owner_id', user.id)
    .single();
  if (orgError || !org) {
    return { error: NextResponse.json({ error: 'Organization not found or unauthorized' }, { status: 403 }) };
  }
  return { orgId };
}

function resolveNetwork(value: unknown) {
  const network = typeof value === 'string' && value ? value : 'stellar-mainnet';
  return isSupportedStellarNetwork(network) ? network : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const owned = await requireOwnedOrg(url.searchParams.get('org_id'));
  if ('error' in owned) return owned.error;

  const network = resolveNetwork(url.searchParams.get('network'));
  if (!network) return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });

  try {
    const assets = await listOrgTrustlines(owned.orgId, network);
    return NextResponse.json({ network, max: MAX_TRUSTLINES_PER_ORG, assets });
  } catch (error) {
    console.error('Stellar trustlines GET failed', error);
    return NextResponse.json({ error: 'Failed to read trustlines' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const owned = await requireOwnedOrg(body.org_id);
  if ('error' in owned) return owned.error;

  const network = resolveNetwork(body.network);
  if (!network) return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });

  const parsed = parseAsset({ code: body.code, issuer: body.issuer });
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  try {
    const existing = await listOrgTrustlines(owned.orgId, network);
    if (existing.length >= MAX_TRUSTLINES_PER_ORG) {
      return NextResponse.json(
        { error: `At most ${MAX_TRUSTLINES_PER_ORG} assets per network` },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from('org_stellar_trustlines').insert({
      org_id: owned.orgId,
      network,
      asset_code: parsed.asset.code,
      asset_issuer: parsed.asset.issuer,
    });
    // Adding an asset that is already listed is what the caller wanted anyway.
    if (error && error.code !== '23505') {
      console.error('Stellar trustlines POST failed', error);
      return NextResponse.json({ error: 'Failed to add asset' }, { status: 500 });
    }
    return NextResponse.json({ network, assets: await listOrgTrustlines(owned.orgId, network) });
  } catch (error) {
    console.error('Stellar trustlines POST failed', error);
    return NextResponse.json({ error: 'Failed to add asset' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const owned = await requireOwnedOrg(body.org_id);
  if ('error' in owned) return owned.error;

  const network = resolveNetwork(body.network);
  if (!network) return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });

  const parsed = parseAsset({ code: body.code, issuer: body.issuer });
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('org_stellar_trustlines')
      .delete()
      .eq('org_id', owned.orgId)
      .eq('network', network)
      .eq('asset_code', parsed.asset.code)
      .eq('asset_issuer', parsed.asset.issuer);
    if (error) {
      console.error('Stellar trustlines DELETE failed', error);
      return NextResponse.json({ error: 'Failed to remove asset' }, { status: 500 });
    }
    // Wallets that already carry the trustline keep it — closing one needs the
    // account's own signature. Delisting only stops new ones being sponsored.
    return NextResponse.json({ network, assets: await listOrgTrustlines(owned.orgId, network) });
  } catch (error) {
    console.error('Stellar trustlines DELETE failed', error);
    return NextResponse.json({ error: 'Failed to remove asset' }, { status: 500 });
  }
}
