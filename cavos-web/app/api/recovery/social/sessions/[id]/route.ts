import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const admin = createAdminClient()
  const { data: session } = await admin
    .from('social_recovery_sessions')
    .select(
      'id, wallet_id, action, provider, status, ephemeral_public_key, attestation_nonce, attestation_claims, result, error_code, expires_at',
    )
    .eq('id', id)
    .maybeSingle()
  if (!session) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })

  if (
    ['starting', 'ready', 'processing'].includes(session.status) &&
    new Date(session.expires_at).getTime() <= Date.now()
  ) {
    await admin
      .from('social_recovery_sessions')
      .update({ status: 'expired', error_code: 'session_expired' })
      .eq('id', id)
    session.status = 'expired'
    session.error_code = 'session_expired'
  }

  let sealedRecord: string | undefined
  if (session.action === 'recover') {
    const { data: enrollment } = await admin
      .from('social_recovery_enrollments')
      .select('sealed_record')
      .eq('wallet_id', session.wallet_id)
      .maybeSingle()
    sealedRecord = enrollment?.sealed_record
  }
  return NextResponse.json({
    session_id: session.id,
    action: session.action,
    provider: session.provider,
    status: session.status,
    ephemeral_public_key_b64: session.ephemeral_public_key,
    attestation_nonce_b64: session.attestation_nonce,
    attestation_claims: session.attestation_claims,
    sealed_record_b64: sealedRecord,
    result: session.status === 'completed' ? session.result : undefined,
    error_code: session.error_code,
    expires_at: session.expires_at,
  })
}
