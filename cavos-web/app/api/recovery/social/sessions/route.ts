import { after, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createRecoveryVm,
  deleteRecoveryVmHedges,
} from '@/lib/recovery/social/google-compute'
import { randomToken, tokenHash, tokenMatches } from '@/lib/recovery/social/security'
import { providerPolicy } from '@/lib/recovery/social/config'
import { ensureRecoveryPool } from '@/lib/recovery/social/pool'
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
  /** Short-lived capability returned before OAuth. It contains no user data. */
  prewarm_id?: string
  prewarm_token?: string
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
      'id, social_recovery_enabled, social_recovery_provider, social_recovery_delay_seconds, social_recovery_audience',
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
        ...providerPolicy(enrollment.provider, environmentPolicy?.social_recovery_audience),
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

  // Claim an already-attested worker that started while the browser was inside
  // OAuth. The UUID alone is not authority: the browser must present the
  // independently generated claim token, and app/environment/provider are
  // fixed before the VM boots. The all-fields update changes a prewarm into a
  // normal session atomically, preserving the session-bound attestation nonce.
  if (body.prewarm_id && body.prewarm_token) {
    const { data: prewarm } = await admin
      .from('social_recovery_sessions')
      .select(
        'id, app_id, environment_id, provider, status, prewarm_token_hash, expires_at',
      )
      .eq('id', body.prewarm_id)
      .is('wallet_id', null)
      .maybeSingle()
    if (
      prewarm &&
      prewarm.app_id === appId &&
      prewarm.environment_id === environment.id &&
      prewarm.provider === environmentPolicy.social_recovery_provider &&
      ['starting', 'ready'].includes(prewarm.status) &&
      new Date(prewarm.expires_at).getTime() > Date.now() &&
      tokenMatches(body.prewarm_token, prewarm.prewarm_token_hash)
    ) {
      const { data: claimed, error: claimError } = await admin
        .from('social_recovery_sessions')
        .update({
          wallet_id: wallet.id,
          action: body.action,
          auth_challenge_hash: authChallengeHash,
          prewarm_token_hash: null,
          prewarm_request_hash: null,
          claimed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
        })
        .eq('id', prewarm.id)
        .eq('prewarm_token_hash', prewarm.prewarm_token_hash)
        .is('wallet_id', null)
        .in('status', ['starting', 'ready'])
        .select('id, status')
        .maybeSingle()
      if (claimError) {
        const conflict = claimError.code === '23505'
        return NextResponse.json(
          { error: conflict ? 'recovery_already_in_progress' : 'prewarm_claim_failed' },
          { status: conflict ? 409 : 500 },
        )
      }
      if (claimed) {
        return NextResponse.json(
          {
            session_id: claimed.id,
            status: claimed.status,
            action: body.action,
            provider: environmentPolicy.social_recovery_provider,
            policy: {
              app_id: appId,
              environment_id: environment.id,
              ...providerPolicy(
                environmentPolicy.social_recovery_provider,
                environmentPolicy.social_recovery_audience,
              ),
            },
            delay_seconds: environmentPolicy.social_recovery_delay_seconds,
            expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
            prewarm_claimed: true,
          },
          { status: claimed.status === 'ready' ? 200 : 202 },
        )
      }
    }
  }

  // Direct SDK consumers may start a recovery without explicitly calling
  // prewarm(). Claim a ready global worker here as a second fast path.
  const implicitClaimToken = randomToken()
  const implicitExpiresAt = new Date(Date.now() + 15 * 60_000).toISOString()
  const { data: poolRows, error: poolClaimError } = await admin.rpc(
    'claim_social_recovery_pool_slot',
    {
      p_app_id: appId,
      p_environment_id: environment.id,
      p_provider: environmentPolicy.social_recovery_provider,
      p_delay_seconds: environmentPolicy.social_recovery_delay_seconds,
      p_claim_token_hash: tokenHash(implicitClaimToken),
      p_request_hash: tokenHash(`session:${wallet.id}`),
      p_expires_at: implicitExpiresAt,
    },
  )
  if (poolClaimError) {
    console.error('[social-recovery] implicit warm-pool claim failed', poolClaimError)
  } else {
    const pool = Array.isArray(poolRows) ? poolRows[0] : poolRows
    if (pool?.id) {
      const { data: claimed, error: claimError } = await admin
        .from('social_recovery_sessions')
        .update({
          wallet_id: wallet.id,
          action: body.action,
          auth_challenge_hash: authChallengeHash,
          prewarm_token_hash: null,
          prewarm_request_hash: null,
          claimed_at: new Date().toISOString(),
          expires_at: implicitExpiresAt,
        })
        .eq('id', pool.id)
        .eq('prewarm_token_hash', tokenHash(implicitClaimToken))
        .is('wallet_id', null)
        .eq('status', 'ready')
        .select('id, status')
        .maybeSingle()
      if (claimError) {
        const conflict = claimError.code === '23505'
        return NextResponse.json(
          { error: conflict ? 'recovery_already_in_progress' : 'warm_pool_claim_failed' },
          { status: conflict ? 409 : 500 },
        )
      }
      if (claimed) {
        after(async () => {
          try {
            await ensureRecoveryPool()
          } catch (error) {
            console.error('[social-recovery] warm-pool refill failed', error)
          }
        })
        return NextResponse.json({
          session_id: claimed.id,
          status: claimed.status,
          action: body.action,
          provider: environmentPolicy.social_recovery_provider,
          policy: {
            app_id: appId,
            environment_id: environment.id,
            ...providerPolicy(
                environmentPolicy.social_recovery_provider,
                environmentPolicy.social_recovery_audience,
              ),
          },
          delay_seconds: environmentPolicy.social_recovery_delay_seconds,
          expires_at: implicitExpiresAt,
          warm_pool_claimed: true,
        })
      }
    }
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
      try {
        const { data: session, error: sessionError } = await admin
          .from('social_recovery_sessions')
          .select('vm_instance_id')
          .eq('id', sessionId)
          .maybeSingle()
        if (sessionError) throw sessionError
        if (session?.vm_instance_id) {
          await deleteRecoveryVmHedges(instanceName, session.vm_instance_id)
        }
      } catch (error) {
        console.error('[social-recovery] post-provision hedge cleanup failed', error)
      }
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
        ...providerPolicy(
                environmentPolicy.social_recovery_provider,
                environmentPolicy.social_recovery_audience,
              ),
      },
      delay_seconds: environmentPolicy.social_recovery_delay_seconds,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
    { status: 202 },
  )
}
