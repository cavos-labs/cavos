/**
 * GET /api/recovery/social/enrollment?app_id=&wallet_address=[&environment=]
 *   → { enrolled: boolean }
 *
 * GET /api/recovery/social/enrollment?app_id=&provider=&subject=[&environment=]
 *   → { enrolled: boolean, wallet_address?: string }
 *
 * Address lookup is the existing SDK check. Subject lookup finds a sealed
 * MasterDEK for this Google/Apple/email identity so a second chain or a new
 * device can unwrap instead of minting a second DEK.
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import {
  isSocialRecoveryProvider,
  providerAudiences,
  providerPolicy,
} from '@/lib/recovery/social/config';
import { identityCommitmentHex } from '@/lib/recovery/social/identityCommitment';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appIdParam = url.searchParams.get('app_id');
  const walletAddress = url.searchParams.get('wallet_address');
  const provider = url.searchParams.get('provider');
  const subject = url.searchParams.get('subject');
  const environment =
    url.searchParams.get('environment_id') || url.searchParams.get('environment') || undefined;

  const identityLookup = Boolean(provider && subject);
  if (!appIdParam || (!walletAddress && !identityLookup)) {
    return NextResponse.json(
      { error: 'app_id and wallet_address, or app_id, provider and subject, are required' },
      { status: 400 },
    );
  }
  if (identityLookup && (typeof subject !== 'string' || subject.length === 0 || subject.length > 256)) {
    return NextResponse.json({ error: 'invalid_subject' }, { status: 400 });
  }
  if (identityLookup && !isSocialRecoveryProvider(provider)) {
    return NextResponse.json({ error: 'unsupported_provider' }, { status: 400 });
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

  if (identityLookup && isSocialRecoveryProvider(provider) && subject) {
    const { data: environmentPolicy } = await admin
      .from('app_environments')
      .select('social_recovery_audiences')
      .eq('id', resolved.environmentId)
      .eq('app_id', resolved.appId)
      .single();
    if (!environmentPolicy) {
      return NextResponse.json({ error: 'environment_not_found' }, { status: 404 });
    }
    const policy = {
      app_id: resolved.appId,
      environment_id: resolved.environmentId,
      ...providerPolicy(provider, providerAudiences(environmentPolicy.social_recovery_audiences)),
    };
    const commitment = identityCommitmentHex(policy, subject);
    const { data: enrollment } = await admin
      .from('social_recovery_enrollments')
      .select('wallet_id, onchain_status')
      .eq('environment_id', resolved.environmentId)
      .eq('identity_commitment', commitment)
      .eq('dek_sealed', true)
      .eq('onchain_status', 'active')
      .limit(1)
      .maybeSingle();
    if (!enrollment?.wallet_id) return NextResponse.json({ enrolled: false });
    const { data: wallet } = await admin
      .from('wallets')
      .select('address')
      .eq('id', enrollment.wallet_id)
      .maybeSingle();
    if (!wallet?.address) return NextResponse.json({ enrolled: false });
    return NextResponse.json({ enrolled: true, wallet_address: wallet.address });
  }

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
