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
    .select('wallet_id, action, status, expires_at, auth_challenge_hash')
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
