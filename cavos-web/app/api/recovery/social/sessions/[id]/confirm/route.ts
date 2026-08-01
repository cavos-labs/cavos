import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyEnrollmentTransaction } from '@/lib/recovery/social/verify-enrollment'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const { tx_hash } = (await request.json()) as { tx_hash?: string }
  if (!tx_hash || tx_hash.length > 256) {
    return NextResponse.json({ error: 'tx_hash_required' }, { status: 400 })
  }
  const admin = createAdminClient()
  const { data: session } = await admin
    .from('social_recovery_sessions')
    .select('wallet_id, action, status')
    .eq('id', id)
    .maybeSingle()
  let walletId: string | undefined
  if (session?.action === 'enroll' && session.status === 'completed') {
    walletId = session.wallet_id
  } else {
    // Pending enrollments survive short-lived VM session cleanup. Their UUID
    // acts only as a lookup reference; activation still requires an exact,
    // successful on-chain proof below.
    const { data: pendingReference } = await admin
      .from('social_recovery_enrollments')
      .select('wallet_id,onchain_status')
      .eq('id', id)
      .maybeSingle()
    if (pendingReference?.onchain_status === 'pending') {
      walletId = pendingReference.wallet_id
    }
  }
  if (!walletId) {
    return NextResponse.json({ error: 'enrollment_session_not_complete' }, { status: 409 })
  }
  const [{ data: wallet }, { data: enrollment }] = await Promise.all([
    admin
      .from('wallets')
      .select('address, network')
      .eq('id', walletId)
      .maybeSingle(),
    admin
      .from('social_recovery_enrollments')
      .select(
        'recovery_pubkey_compressed,recovery_pub_x,recovery_pub_y,delay_seconds,policy_hash,onchain_status',
      )
      .eq('wallet_id', walletId)
      .maybeSingle(),
  ])
  if (!wallet || !enrollment || enrollment.onchain_status !== 'pending') {
    return NextResponse.json({ error: 'enrollment_not_pending' }, { status: 409 })
  }

  let verified = false
  try {
    verified = await verifyEnrollmentTransaction({
      txHash: tx_hash,
      network: wallet.network,
      walletAddress: wallet.address,
      recoveryPubkeyCompressedB64: enrollment.recovery_pubkey_compressed,
      recoveryXHex: enrollment.recovery_pub_x,
      recoveryYHex: enrollment.recovery_pub_y,
      delaySeconds: enrollment.delay_seconds,
      policyHashHex: enrollment.policy_hash,
    })
  } catch (error) {
    console.error('[social-recovery] enrollment transaction verification failed', error)
  }
  if (!verified) {
    return NextResponse.json({ error: 'enrollment_transaction_not_verified' }, { status: 409 })
  }

  const { data: activated, error } = await admin
    .from('social_recovery_enrollments')
    .update({
      enrollment_tx_hash: tx_hash,
      onchain_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('wallet_id', walletId)
    .eq('onchain_status', 'pending')
    .select('id')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'enrollment_confirm_failed' }, { status: 500 })
  if (!activated) return NextResponse.json({ error: 'enrollment_not_pending' }, { status: 409 })
  return NextResponse.json({ confirmed: true })
}
