import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface EncryptedJob {
  client_public_key_b64?: string
  nonce_b64?: string
  ciphertext_b64?: string
}

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
    .select('status, expires_at')
    .eq('id', id)
    .maybeSingle()
  if (!session) return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  if (session.status !== 'ready') {
    return NextResponse.json({ error: 'session_not_ready' }, { status: 409 })
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'session_expired' }, { status: 410 })
  }
  const { error } = await admin
    .from('social_recovery_sessions')
    .update({
      encrypted_job: body,
      status: 'processing',
    })
    .eq('id', id)
    .eq('status', 'ready')
  if (error) return NextResponse.json({ error: 'job_store_failed' }, { status: 500 })
  return NextResponse.json({ accepted: true }, { status: 202 })
}
