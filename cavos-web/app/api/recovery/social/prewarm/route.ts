import { after, NextResponse } from 'next/server'
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit'
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier'
import { createRecoveryVm } from '@/lib/recovery/social/google-compute'
import { randomToken, tokenHash } from '@/lib/recovery/social/security'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 300

interface PrewarmBody {
  app_id?: string
  environment_id?: string
  environment?: 'development' | 'production'
}

const PREWARM_TTL_MS = 3 * 60_000

export async function POST(request: Request) {
  let body: PrewarmBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!body.app_id) {
    return NextResponse.json({ error: 'app_id is required' }, { status: 400 })
  }

  const ip = clientIp(request)
  const localLimit = checkRateLimit(`social-recovery-prewarm:${ip}`, 3, 10 * 60_000)
  if (!localLimit.allowed) {
    return NextResponse.json(
      { error: 'prewarm_rate_limited' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(localLimit.retryAfterMs / 1000)) },
      },
    )
  }

  const resolvedApp = await resolveAppIdentifier(
    body.app_id,
    body.environment_id || body.environment,
  )
  if (!resolvedApp?.environmentId) {
    return NextResponse.json({ error: 'environment_not_found' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: policy } = await admin
    .from('app_environments')
    .select('social_recovery_enabled, social_recovery_provider, social_recovery_delay_seconds')
    .eq('id', resolvedApp.environmentId)
    .eq('app_id', resolvedApp.appId)
    .single()
  if (!policy?.social_recovery_enabled || !policy.social_recovery_provider) {
    return NextResponse.json({ error: 'social_recovery_disabled' }, { status: 403 })
  }

  // The endpoint is public before OAuth. Bound its cloud-spend exposure both
  // per requester and per environment using durable rows, in addition to the
  // cheap per-process limiter above.
  const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString()
  const requestHash = tokenHash(`${resolvedApp.appId}:${ip}`)
  const [{ count: requesterStarts }, { count: environmentStarts }] = await Promise.all([
    admin
      .from('social_recovery_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('prewarm_request_hash', requestHash)
      .gte('created_at', tenMinutesAgo),
    admin
      .from('social_recovery_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('environment_id', resolvedApp.environmentId)
      .is('wallet_id', null)
      .in('status', ['starting', 'ready'])
      .gte('created_at', tenMinutesAgo),
  ])
  if ((requesterStarts || 0) >= 3 || (environmentStarts || 0) >= 20) {
    return NextResponse.json({ error: 'prewarm_rate_limited' }, { status: 429 })
  }

  const prewarmId = crypto.randomUUID()
  const claimToken = randomToken()
  const bootstrapToken = randomToken()
  const instanceName = `cavos-rec-${prewarmId.replaceAll('-', '').slice(0, 24)}`
  const expiresAt = new Date(Date.now() + PREWARM_TTL_MS).toISOString()
  const { error: insertError } = await admin.from('social_recovery_sessions').insert({
    id: prewarmId,
    wallet_id: null,
    app_id: resolvedApp.appId,
    environment_id: resolvedApp.environmentId,
    action: null,
    provider: policy.social_recovery_provider,
    delay_seconds: policy.social_recovery_delay_seconds,
    auth_challenge_hash: null,
    bootstrap_token_hash: tokenHash(bootstrapToken),
    prewarm_token_hash: tokenHash(claimToken),
    prewarm_request_hash: requestHash,
    vm_instance_name: instanceName,
    expires_at: expiresAt,
  })
  if (insertError) {
    console.error('[social-recovery] prewarm session insert failed', insertError)
    return NextResponse.json({ error: 'prewarm_create_failed' }, { status: 500 })
  }

  after(async () => {
    try {
      await createRecoveryVm({
        sessionId: prewarmId,
        bootstrapToken,
        instanceName,
      })
    } catch (error) {
      await admin
        .from('social_recovery_sessions')
        .update({ status: 'failed', error_code: 'vm_create_failed' })
        .eq('id', prewarmId)
        .eq('status', 'starting')
      console.error('[social-recovery] prewarm VM create failed', error)
    }
  })

  return NextResponse.json(
    {
      prewarm_id: prewarmId,
      claim_token: claimToken,
      status: 'starting',
      expires_at: expiresAt,
    },
    { status: 202 },
  )
}
