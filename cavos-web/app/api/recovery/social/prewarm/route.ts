import { after, NextResponse } from 'next/server'
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit'
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier'
import { ensureRecoveryPool } from '@/lib/recovery/social/pool'
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

  const claimToken = randomToken()
  const expiresAt = new Date(Date.now() + PREWARM_TTL_MS).toISOString()
  const { data, error: claimError } = await admin.rpc('claim_social_recovery_pool_slot', {
    p_app_id: resolvedApp.appId,
    p_environment_id: resolvedApp.environmentId,
    p_provider: policy.social_recovery_provider,
    p_delay_seconds: policy.social_recovery_delay_seconds,
    p_claim_token_hash: tokenHash(claimToken),
    p_request_hash: requestHash,
    p_expires_at: expiresAt,
  })
  if (claimError) {
    console.error('[social-recovery] warm-pool claim failed', claimError)
    return NextResponse.json({ error: 'prewarm_claim_failed' }, { status: 500 })
  }
  const claimed = Array.isArray(data) ? data[0] : data

  // A missing slot never blocks login. Start/retry pool maintenance now; the
  // SDK will continue through the explicit cold fallback for this request.
  if (!claimed?.id) {
    after(async () => {
      try {
        await ensureRecoveryPool()
      } catch (error) {
        console.error('[social-recovery] warm-pool refill failed', error)
      }
    })
    return NextResponse.json({ error: 'warm_pool_unavailable' }, { status: 503 })
  }

  // Refill immediately after reserving the one-shot worker. Provisioning is
  // off the login path and the claimed enclave stays dedicated to this browser.
  after(async () => {
    try {
      await ensureRecoveryPool()
    } catch (error) {
      console.error('[social-recovery] warm-pool refill failed', error)
    }
  })

  return NextResponse.json(
    {
      prewarm_id: claimed.id,
      claim_token: claimToken,
      status: 'ready',
      expires_at: claimed.expires_at || expiresAt,
    },
    { status: 200 },
  )
}
