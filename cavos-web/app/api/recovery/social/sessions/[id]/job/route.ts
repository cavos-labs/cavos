import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runJob } from '@/lib/recovery/social/enclave'

/**
 * Submit the encrypted job and return the enclave's result.
 *
 * This used to park the ciphertext in a database row for a booting VM to poll
 * for, then answer `202 accepted` and leave the browser polling a second
 * endpoint for the outcome. The enclave is already running, so the whole
 * exchange is one request now: the two polling loops in the SDK, and the row
 * columns that carried the job between them, are gone.
 *
 * The body is opaque here. It is encrypted to a key only the enclave holds, so
 * this route validates shape and size and forwards the bytes.
 */

interface EncryptedJob {
  client_public_key_b64?: string
  nonce_b64?: string
  ciphertext_b64?: string
}

export const maxDuration = 30

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  let body: EncryptedJob
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!body.client_public_key_b64 || !body.nonce_b64 || !body.ciphertext_b64) {
    return NextResponse.json({ error: 'encrypted_job_incomplete' }, { status: 400 })
  }
  if (
    body.client_public_key_b64.length > 256 ||
    body.nonce_b64.length > 32 ||
    body.ciphertext_b64.length > 131072
  ) {
    return NextResponse.json({ error: 'encrypted_job_too_large' }, { status: 413 })
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from('social_recovery_sessions')
    .select(
      'wallet_id, app_id, environment_id, action, provider, delay_seconds, status, expires_at, auth_challenge_hash',
    )
    .eq('id', id)
    .maybeSingle()
  if (!session) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  if (session.status !== 'ready') {
    return NextResponse.json({ error: 'session_not_ready' }, { status: 409 })
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'session_expired' }, { status: 410 })
  }

  // Claim the row before calling the enclave. The enclave also refuses a second
  // job for the same session — it drops the channel key when it runs one — but
  // taking the row first means two concurrent submissions cannot both reach it.
  const { data: claimed } = await admin
    .from('social_recovery_sessions')
    .update({ status: 'processing' })
    .eq('id', id)
    .eq('status', 'ready')
    .select('id')
    .maybeSingle()
  if (!claimed) {
    return NextResponse.json({ error: 'session_not_ready' }, { status: 409 })
  }

  try {
    const { result } = await runJob({
      sessionId: id,
      job: body as Required<EncryptedJob>,
      authChallengeHash: session.auth_challenge_hash,
    })
    // A successful enrolment has to be persisted here. The enclave's output is
    // the only copy of the sealed record, and losing it means the wallet can
    // never be recovered — so this runs before the session is marked complete.
    if (session.action === 'enroll') {
      await persistEnrollment(admin, session, result)
    }

    await admin
      .from('social_recovery_sessions')
      .update({ status: 'completed', result, completed_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({ status: 'completed', result })
  } catch (error) {
    // The session is spent either way: the enclave discards the channel key as
    // soon as it claims a job, so this exact session can never succeed now.
    // Marking it failed releases the auth challenge for a clean retry.
    await admin
      .from('social_recovery_sessions')
      .update({ status: 'failed', error_code: 'enclave_job_failed' })
      .eq('id', id)
    console.error('[social-recovery] enclave job failed', error)
    return NextResponse.json({ error: 'enclave_job_failed' }, { status: 502 })
  }
}

interface SessionRow {
  wallet_id: string
  app_id: string
  environment_id: string
  provider: string
  delay_seconds: number
}

/**
 * Store the recovery authority the enclave just generated.
 *
 * This used to live in the `workload/complete` callback, which existed because
 * a Confidential Space VM had to phone home when it finished. There is no
 * callback any more — the enclave answers inline — so the persistence moved
 * here with it.
 *
 * It throws rather than warning: `sealed_record` is the only copy of the
 * material that can recover this wallet, and a session that reports success
 * without it would leave the user believing they are enrolled when they are
 * not.
 */
async function persistEnrollment(
  admin: ReturnType<typeof createAdminClient>,
  session: SessionRow,
  result: Record<string, unknown>,
): Promise<void> {
  const required = [
    'sealed_record_b64',
    'identity_commitment_hex',
    'policy_hash_hex',
    'recovery_pubkey_compressed_b64',
    'recovery_x_hex',
    'recovery_y_hex',
  ] as const
  for (const field of required) {
    if (!result[field]) throw new Error(`enclave enrolment result is missing ${field}`)
  }

  const { data: wallet } = await admin
    .from('wallets')
    .select('network')
    .eq('id', session.wallet_id)
    .single()
  if (!wallet) throw new Error('enrolment wallet is missing')

  const { error } = await admin.from('social_recovery_enrollments').upsert(
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
      // Stellar classic cannot install a restricted authority on-chain, so its
      // sealed DEK record is complete the moment the enclave returns.
      // Starknet and Solana stay pending until the device confirms the
      // enrolment transaction.
      onchain_status: String(wallet.network).startsWith('stellar-') ? 'active' : 'pending',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'wallet_id' },
  )
  if (error) throw new Error(`enrolment persistence failed: ${error.message}`)
}
