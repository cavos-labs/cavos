/**
 * GET /api/recovery/social/enrollment?app_id=&wallet_address=[&environment=]
 *   → { enrolled: boolean }
 *
 * Whether this wallet already has an active social-recovery enrollment.
 *
 * The SDK asks once per connect, for two reasons. It lets an app tell a
 * protected wallet from an unprotected one, which it previously had no way to
 * know and therefore tended to assert. And it lets the SDK skip re-enrolling a
 * wallet that is already enrolled: without this, every fresh login ran a full
 * enclave round trip that ended in the 409 from ../sessions.
 *
 * Public in the same sense as the rest of the SDK surface — it takes the app's
 * public id and an address, and answers one boolean about an address the caller
 * already holds. It reveals nothing that address does not.
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appIdParam = url.searchParams.get('app_id');
  const walletAddress = url.searchParams.get('wallet_address');
  const environment =
    url.searchParams.get('environment_id') || url.searchParams.get('environment') || undefined;

  if (!appIdParam || !walletAddress) {
    return NextResponse.json(
      { error: 'app_id and wallet_address are required' },
      { status: 400 },
    );
  }

  const rl = checkRateLimit(`social-enrollment:${clientIp(request)}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const resolved = await resolveAppIdentifier(appIdParam, environment);
  if (!resolved?.environmentId) {
    return NextResponse.json({ error: 'environment_not_found' }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: wallet } = await admin
    .from('wallets')
    .select('id')
    .eq('app_id', resolved.appId)
    .eq('environment_id', resolved.environmentId)
    .eq('address', walletAddress)
    .maybeSingle();

  // A wallet the backend has never seen cannot be enrolled. That is an answer,
  // not an error: a brand-new wallet asks this before it has registered.
  if (!wallet) return NextResponse.json({ enrolled: false });

  const { data: enrollment } = await admin
    .from('social_recovery_enrollments')
    .select('onchain_status')
    .eq('wallet_id', wallet.id)
    .maybeSingle();

  // `pending` means the enclave minted an authority the chain has not accepted
  // yet, so the wallet is not protected and re-enrolling is the right move.
  // ../sessions reuses that same authority rather than minting a second one.
  return NextResponse.json({ enrolled: enrollment?.onchain_status === 'active' });
}
