import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteRecoveryVm } from '@/lib/recovery/social/google-compute'
import { bearer, tokenMatches } from '@/lib/recovery/social/security'
import type { WorkloadResult } from '@/lib/recovery/social/types'

export async function POST(request: Request) {
  const token = bearer(request)
  const sessionId = request.headers.get('x-cavos-recovery-session')
  if (!token || !sessionId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let body: { result?: WorkloadResult }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!body.result || !['enrolled', 'recovered'].includes(body.result.result)) {
    return NextResponse.json({ error: 'invalid_workload_result' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from('social_recovery_sessions')
    .select(
      'id, wallet_id, app_id, environment_id, action, provider, delay_seconds, status, workload_token_hash, vm_instance_name',
    )
    .eq('id', sessionId)
    .maybeSingle()
  if (
    !session ||
    session.status !== 'processing' ||
    !tokenMatches(token, session.workload_token_hash)
  ) {
    return NextResponse.json({ error: 'completion_rejected' }, { status: 401 })
  }
  if (
    (session.action === 'enroll' && body.result.result !== 'enrolled') ||
    (session.action === 'recover' && body.result.result !== 'recovered')
  ) {
    return NextResponse.json({ error: 'result_action_mismatch' }, { status: 400 })
  }

  if (body.result.result === 'enrolled') {
    const result = body.result as WorkloadResult & {
      sealed_record_b64?: string
      identity_commitment_hex?: string
      policy_hash_hex?: string
      recovery_pubkey_compressed_b64?: string
      recovery_x_hex?: string
      recovery_y_hex?: string
    }
    if (
      !result.sealed_record_b64 ||
      !result.identity_commitment_hex ||
      !result.policy_hash_hex ||
      !result.recovery_pubkey_compressed_b64 ||
      !result.recovery_x_hex ||
      !result.recovery_y_hex
    ) {
      return NextResponse.json({ error: 'enrollment_result_incomplete' }, { status: 400 })
    }
    const { data: wallet } = await admin
      .from('wallets')
      .select('network')
      .eq('id', session.wallet_id)
      .single()
    if (!wallet) {
      return NextResponse.json({ error: 'enrollment_wallet_missing' }, { status: 409 })
    }
    const { error: enrollmentError } = await admin
      .from('social_recovery_enrollments')
      .upsert(
        {
          wallet_id: session.wallet_id,
          app_id: session.app_id,
          environment_id: session.environment_id,
          provider: session.provider,
          delay_seconds: session.delay_seconds,
          identity_commitment: result.identity_commitment_hex,
          policy_hash: result.policy_hash_hex,
          recovery_pubkey_compressed: result.recovery_pubkey_compressed_b64,
          recovery_pub_x: result.recovery_x_hex,
          recovery_pub_y: result.recovery_y_hex,
          sealed_record: result.sealed_record_b64,
          // Stellar classic cannot install a restricted authority on-chain.
          // Its KMS-sealed DEK record is complete as soon as the attested
          // workload returns; Starknet/Solana remain pending until the device
          // confirms the enrollment transaction.
          onchain_status: String(wallet.network).startsWith('stellar-')
            ? 'active'
            : 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_id' },
      )
    if (enrollmentError) {
      console.error('[social-recovery] enrollment persistence failed', enrollmentError)
      return NextResponse.json({ error: 'enrollment_store_failed' }, { status: 500 })
    }
  }

  const { error: completeError } = await admin
    .from('social_recovery_sessions')
    .update({
      status: 'completed',
      result: body.result,
      encrypted_job: null,
      workload_token_hash: null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', session.id)
    .eq('status', 'processing')
  if (completeError) {
    return NextResponse.json({ error: 'completion_store_failed' }, { status: 500 })
  }

  try {
    await deleteRecoveryVm(session.vm_instance_name)
    await admin
      .from('social_recovery_sessions')
      .update({ vm_deleted_at: new Date().toISOString() })
      .eq('id', session.id)
  } catch (error) {
    // Result is already safe and persisted. The scheduled cleanup endpoint can
    // retry VM deletion; do not force the workload to repeat KMS/signing.
    console.error('[social-recovery] VM cleanup failed', error)
  }
  return NextResponse.json({ accepted: true })
}
