/**
 * GET    /api/stellar/trustlines?app_id=&network=   → the app's allowlist
 * POST   /api/stellar/trustlines  { app_id, network?, code, issuer }
 * DELETE /api/stellar/trustlines  { app_id, network?, code, issuer }
 *
 * The assets an app's wallets may hold, and so the ones its org's sponsor will
 * pay a trustline reserve for. Owners of the app's org only; the relay reads the
 * same rows through the service role.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupportedStellarNetwork } from '@/lib/stellar/relayer';
import {
  MAX_TRUSTLINES_PER_APP,
  listAppTrustlines,
  parseAsset,
} from '@/lib/stellar/trustlines';

/** Authenticate, and confirm the caller owns the org the app belongs to. */
async function requireOwnedApp(appId: unknown) {
  if (typeof appId !== 'string' || !appId) {
    return { error: NextResponse.json({ error: 'app_id is required' }, { status: 400 }) };
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  // `apps` is joined to `organizations` so ownership is checked in one round
  // trip; RLS on `apps` alone would not prove who owns the org.
  const { data: app, error: appError } = await supabase
    .from('apps')
    .select('id, organizations!inner(owner_id)')
    .eq('id', appId)
    .eq('organizations.owner_id', user.id)
    .maybeSingle();
  if (appError || !app) {
    return { error: NextResponse.json({ error: 'App not found or unauthorized' }, { status: 403 }) };
  }
  return { appId };
}

function resolveNetwork(value: unknown) {
  const network = typeof value === 'string' && value ? value : 'stellar-mainnet';
  return isSupportedStellarNetwork(network) ? network : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const owned = await requireOwnedApp(url.searchParams.get('app_id'));
  if ('error' in owned) return owned.error;

  const network = resolveNetwork(url.searchParams.get('network'));
  if (!network) return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });

  try {
    const assets = await listAppTrustlines(owned.appId, network);
    return NextResponse.json({ network, max: MAX_TRUSTLINES_PER_APP, assets });
  } catch (error) {
    console.error('Stellar trustlines GET failed', error);
    return NextResponse.json({ error: 'Failed to read trustlines' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const owned = await requireOwnedApp(body.app_id);
  if ('error' in owned) return owned.error;

  const network = resolveNetwork(body.network);
  if (!network) return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });

  const parsed = parseAsset({ code: body.code, issuer: body.issuer });
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  try {
    const existing = await listAppTrustlines(owned.appId, network);
    if (existing.length >= MAX_TRUSTLINES_PER_APP) {
      return NextResponse.json(
        { error: `At most ${MAX_TRUSTLINES_PER_APP} assets per network` },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from('app_stellar_trustlines').insert({
      app_id: owned.appId,
      network,
      asset_code: parsed.asset.code,
      asset_issuer: parsed.asset.issuer,
    });
    // Adding an asset that is already listed is what the caller wanted anyway.
    if (error && error.code !== '23505') {
      console.error('Stellar trustlines POST failed', error);
      return NextResponse.json({ error: 'Failed to add asset' }, { status: 500 });
    }
    return NextResponse.json({ network, assets: await listAppTrustlines(owned.appId, network) });
  } catch (error) {
    console.error('Stellar trustlines POST failed', error);
    return NextResponse.json({ error: 'Failed to add asset' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const owned = await requireOwnedApp(body.app_id);
  if ('error' in owned) return owned.error;

  const network = resolveNetwork(body.network);
  if (!network) return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });

  const parsed = parseAsset({ code: body.code, issuer: body.issuer });
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('app_stellar_trustlines')
      .delete()
      .eq('app_id', owned.appId)
      .eq('network', network)
      .eq('asset_code', parsed.asset.code)
      .eq('asset_issuer', parsed.asset.issuer);
    if (error) {
      console.error('Stellar trustlines DELETE failed', error);
      return NextResponse.json({ error: 'Failed to remove asset' }, { status: 500 });
    }
    // Wallets that already carry the trustline keep it — closing one needs the
    // account's own signature. Delisting only stops new ones being sponsored.
    return NextResponse.json({ network, assets: await listAppTrustlines(owned.appId, network) });
  } catch (error) {
    console.error('Stellar trustlines DELETE failed', error);
    return NextResponse.json({ error: 'Failed to remove asset' }, { status: 500 });
  }
}
