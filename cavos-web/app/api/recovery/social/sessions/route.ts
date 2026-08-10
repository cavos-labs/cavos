import { after, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRecoveryVm } from '@/lib/recovery/social/google-compute'
import { randomToken, tokenHash } from '@/lib/recovery/social/security'
import { providerPolicy } from '@/lib/recovery/social/config'
import type { SocialRecoveryAction } from '@/lib/recovery/social/types'
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier'

export const maxDuration = 300

interface StartBody {
  app_id?: string
  environment_id?: string
  environment?: 'development' | 'production'
  wallet_address?: string
  action?: SocialRecoveryAction
  /** Base64url SHA-256 of the fresh provider ID token; never the token itself. */
  auth_challenge?: string
}

export async function POST(request: Request) {
  let body: StartBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (
    !body.app_id ||
    !body.wallet_address ||
    !['enroll', 'recover'].includes(body.action || '') ||
    !body.auth_challenge
  ) {
    return NextResponse.json(
      { error: 'app_id, wallet_address, action and auth_challenge are required' },
      { status: 400 },
    )
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(body.auth_challenge)) {
    return NextResponse.json({ error: 'invalid_auth_challenge' }, { status: 400 })
  }

  const resolvedApp = await resolveAppIdentifier(
    body.app_id,
    body.environment_id || body.environment,
  )
  if (!resolvedApp?.environmentId) {
    return NextResponse.json({ error: 'environment_not_found' }, { status: 404 })
  }
  const appId = resolvedApp.appId
  const environment = { id: resolvedApp.environmentId }
  const admin = createAdminClient()
  const authChallengeHash = tokenHash(body.auth_challenge)
  const { data: replayedChallenge } = await admin
    .from('social_recovery_sessions')
    .select('id')
    .eq('auth_challenge_hash', authChallengeHash)
    .maybeSingle()
  if (replayedChallenge) {
    return NextResponse.json({ error: 'auth_credential_replayed' }, { status: 409 })
  }
  const { data: environmentPolicy } = await admin
    .from('app_environments')
    .select(
      'id, social_recovery_enabled, social_recovery_provider, social_recovery_delay_seconds',
    )
    .eq('id', environment.id)
    .eq('app_id', appId)
    .single()
  if (!environmentPolicy?.social_recovery_enabled || !environmentPolicy.social_recovery_provider) {
    return NextResponse.json({ error: 'social_recovery_disabled' }, { status: 403 })
  }

  const { data: wallet } = await admin
    .from('wallets')
    .select('id, address, network')
    .eq('app_id', appId)
    .eq('environment_id', environment.id)
    .eq('address', body.wallet_address)
    .maybeSingle()
  if (!wallet) return NextResponse.json({ error: 'wallet_not_found' }, { status: 404 })

  const { data: enrollment } = await admin
    .from('social_recovery_enrollments')
    .select(
      'id, onchain_status, provider, delay_seconds, policy_hash, recovery_pubkey_compressed, recovery_pub_x, recovery_pub_y',
    )
    .eq('wallet_id', wallet.id)
    .maybeSingle()
  if (body.action === 'enroll' && enrollment?.onchain_status === 'active') {
    return NextResponse.json({ error: 'already_enrolled' }, { status: 409 })
  }
  if (body.action === 'enroll' && enrollment?.onchain_status === 'pending') {
    // A TEE session may have completed before the browser submitted/confirmed
    // the on-chain transaction. Reuse that exact authority; generating a new
    // key could strand a one-shot account if the original tx later lands.
    return NextResponse.json({
      session_id: enrollment.id,
      status: 'completed',
      action: 'enroll',
      provider: enrollment.provider,
      policy: {
        app_id: appId,
        environment_id: environment.id,
        ...providerPolicy(enrollment.provider),
      },
      delay_seconds: enrollment.delay_seconds,
      resume_result: {
        result: 'enrolled',
        policy_hash_hex: enrollment.policy_hash,
        recovery_pubkey_compressed_b64: enrollment.recovery_pubkey_compressed,
        recovery_x_hex: enrollment.recovery_pub_x,
        recovery_y_hex: enrollment.recovery_pub_y,
      },
    })
  }
  if (body.action === 'recover' && enrollment?.onchain_status !== 'active') {
    return NextResponse.json({ error: 'not_enrolled' }, { status: 409 })
  }

  // Each request boots a billable VM. Keep abuse bounded even if an attacker
  // knows the public app id.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: walletStarts } = await admin
    .from('social_recovery_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_id', wallet.id)
    .gte('created_at', hourAgo)
  if ((walletStarts || 0) >= 5) {
    return NextResponse.json({ error: 'recovery_rate_limited' }, { status: 429 })
  }

  const sessionId = crypto.randomUUID()
  const bootstrapToken = randomToken()
  const instanceName = `cavos-rec-${sessionId.replaceAll('-', '').slice(0, 24)}`
  const { error: insertError } = await admin.from('social_recovery_sessions').insert({
    id: sessionId,
    wallet_id: wallet.id,
    app_id: appId,
    environment_id: environment.id,
    action: body.action,
    provider: environmentPolicy.social_recovery_provider,
    delay_seconds: environmentPolicy.social_recovery_delay_seconds,
    auth_challenge_hash: authChallengeHash,
    bootstrap_token_hash: tokenHash(bootstrapToken),
    vm_instance_name: instanceName,
  })
  if (insertError) {
    const conflict = insertError.code === '23505'
    if (conflict) {
      const { data: replayed } = await admin
        .from('social_recovery_sessions')
        .select('id')
        .eq('auth_challenge_hash', authChallengeHash)
        .maybeSingle()
      if (replayed) {
        return NextResponse.json({ error: 'auth_credential_replayed' }, { status: 409 })
      }
    }
    return NextResponse.json(
      { error: conflict ? 'recovery_already_in_progress' : 'session_create_failed' },
      { status: conflict ? 409 : 500 },
    )
  }

  // Compute insert operations can take longer than an HTTP request, especially
  // when capacity fallback has to try multiple zones. Keep provisioning alive
  // after returning the session so the browser can start polling immediately.
  after(async () => {
    try {
      await createRecoveryVm({ sessionId, bootstrapToken, instanceName })
    } catch (error) {
      await admin
        .from('social_recovery_sessions')
        .update({ status: 'failed', error_code: 'vm_create_failed' })
        .eq('id', sessionId)
        .eq('status', 'starting')
      console.error('[social-recovery] VM create failed', error)
    }
  })

  return NextResponse.json(
    {
      session_id: sessionId,
      status: 'starting',
      action: body.action,
      provider: environmentPolicy.social_recovery_provider,
      policy: {
        app_id: appId,
        environment_id: environment.id,
        ...providerPolicy(environmentPolicy.social_recovery_provider),
      },
      delay_seconds: environmentPolicy.social_recovery_delay_seconds,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
    { status: 202 },
  )
}
