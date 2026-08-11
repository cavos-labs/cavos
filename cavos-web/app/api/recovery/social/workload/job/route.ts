import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { bearer, tokenMatches } from '@/lib/recovery/social/security'

export async function GET(request: Request) {
  const token = bearer(request)
  const sessionId = request.headers.get('x-cavos-recovery-session')
  if (!token || !sessionId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient()
  const { data: session } = await admin
    .from('social_recovery_sessions')
    .select('status, pool_slot, workload_token_hash, auth_challenge_hash, encrypted_job, expires_at')
    .eq('id', sessionId)
    .maybeSingle()
  if (!session || !tokenMatches(token, session.workload_token_hash)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'session_expired' }, { status: 410 })
  }
  if (session.status === 'ready') {
    return NextResponse.json({ job: null, active: !session.pool_slot })
  }
  if (session.status !== 'processing' || !session.encrypted_job) {
    return NextResponse.json({ error: 'session_not_processable' }, { status: 409 })
  }
  if (!session.auth_challenge_hash) {
    return NextResponse.json({ error: 'auth_challenge_missing' }, { status: 409 })
  }
  return NextResponse.json({
    job: session.encrypted_job,
    auth_challenge_hash: session.auth_challenge_hash,
  })
}
