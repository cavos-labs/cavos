import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tokenHash } from '@/lib/recovery/social/security'
import {
  isSocialRecoveryProvider,
  providerAudiences,
  providerPolicy,
} from '@/lib/recovery/social/config'
import { openSession } from '@/lib/recovery/social/enclave'
import type { SocialRecoveryAction } from '@/lib/recovery/social/types'
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier'

/**
 * Start a recovery session.
 *
 * The enclave is always running, so this returns a ready, attested session in a
 * single round trip. The previous implementation booted a Confidential Space VM
 * here and answered `202 starting`, leaving the browser to poll for 49–134
 * seconds — and to fail outright about nine percent of the time when no zone
 * had capacity. There is no prewarm and no warm pool any more because there is
 * nothing left to warm.
 */

interface StartBody {
  app_id?: string
  environment_id?: string
  environment?: 'development' | 'production'
  wallet_address?: string
  action?: SocialRecoveryAction
  /**
   * Which provider signed the credential this session is for, read by the SDK
   * from the token's `iss`. Optional: SDK versions predating multi-provider
   * support do not send it, and fall back to the environment's legacy setting.
   *
   * Taking it from the request is safe. It selects a policy; it does not relax
   * one. The audience still comes from stored configuration, and the enclave
   * binds issuer, audience and subject into the identity commitment and refuses
   * a recovery whose credential provider differs from the sealed record — so a
   * false claim can only act as an identity it can already prove.
   */
  provider?: string
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

  // One ID token, one session. The uniqueness index is partial over live
  // statuses, so a session that failed or expired releases its challenge and
  // the browser can retry with the same credential instead of sending the user
  // back through the provider.
  const { data: replayedChallenge } = await admin
    .from('social_recovery_sessions')
    .select('id')
    .eq('auth_challenge_hash', authChallengeHash)
    .in('status', ['ready', 'completed'])
    .maybeSingle()
  if (replayedChallenge) {
    return NextResponse.json({ error: 'auth_credential_replayed' }, { status: 409 })
  }

  const { data: environmentPolicy } = await admin
    .from('app_environments')
    .select(
      'id, social_recovery_enabled, social_recovery_provider, social_recovery_delay_seconds, social_recovery_audiences',
    )
    .eq('id', environment.id)
    .eq('app_id', appId)
    .single()
  if (!environmentPolicy?.social_recovery_enabled) {
    return NextResponse.json({ error: 'social_recovery_disabled' }, { status: 403 })
  }

  // The provider is a property of the credential. Older SDKs do not send one,
  // so the environment's legacy setting stands in — that is the only remaining
  // use for that column. An environment with neither is misconfigured rather
  // than disabled, and says so.
  const provider = body.provider ?? environmentPolicy.social_recovery_provider
  if (!isSocialRecoveryProvider(provider)) {
    return NextResponse.json(
      {
        error: body.provider ? 'unsupported_provider' : 'provider_not_determined',
        detail: body.provider
          ? `Social recovery supports google, apple and email; got "${body.provider}".`
          : 'This SDK version does not send an identity provider and the environment has no fallback configured. Upgrade @cavos/kit, or set a fallback provider on the environment.',
      },
      { status: 400 },
    )
  }

  // Deliberately NOT authenticated with the user's id_token. That token proves
  // identity to the ENCLAVE, which binds iss/aud/sub into the identity
  // commitment; the control plane is untrusted by design and only ever sees a
  // SHA-256 fingerprint of it. Requiring it here would put the raw credential in
  // front of the one component this flow assumes is compromised.
  //
  // Starting a session for an address that is not yours therefore gains nothing:
  // the enclave releases nothing unless the credential matches the commitment.
  // The wallet lookup below is what keeps the address to this app/environment.
  const { data: wallet } = await admin
    .from('wallets')
    .select('id, address, network')
    .eq('app_id', appId)
    .eq('environment_id', environment.id)
    .eq('address', body.wallet_address)
    .maybeSingle()
  if (!wallet) return NextResponse.json({ error: 'wallet_not_found' }, { status: 404 })

  const policy = {
    app_id: appId,
    environment_id: environment.id,
    ...providerPolicy(provider, providerAudiences(environmentPolicy.social_recovery_audiences)),
  }

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
    // The enclave finished a previous attempt before the browser submitted the
    // on-chain transaction. Reuse that exact authority: minting a new one could
    // strand the account if the original transaction later lands.
    return NextResponse.json({
      session_id: enrollment.id,
      status: 'completed',
      action: 'enroll',
      provider: enrollment.provider,
      policy,
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
  // Two different situations used to answer the same way, and the SDK retried
  // both for five minutes: a wallet mid-enrolment on another device, where
  // waiting is exactly right, and a wallet that never enrolled at all, where
  // waiting can only ever time out. The row tells them apart.
  if (body.action === 'recover' && enrollment?.onchain_status === 'pending') {
    return NextResponse.json(
      {
        error: 'enrollment_pending',
        detail: 'This wallet is being enrolled right now. Retry shortly.',
      },
      { status: 409 },
    )
  }
  if (body.action === 'recover' && enrollment?.onchain_status !== 'active') {
    return NextResponse.json(
      {
        error: 'not_enrolled',
        detail:
          'This wallet has no recovery authority on-chain, so there is nothing to recover with. ' +
          'Sign in on a device that already controls the wallet to set it up.',
      },
      { status: 409 },
    )
  }
  // A wallet is recoverable only through the provider it enrolled with: the
  // enclave binds issuer and subject into the identity commitment, and the same
  // person's Google and Apple identities are different subjects under different
  // issuers. Catching it here is only about the error. Sent on, the enclave
  // refuses it as `request_failed` and says nothing about why — deliberately,
  // so the untrusted relay learns nothing about a credential — which leaves the
  // user staring at a failure with no way to discover they simply used the
  // wrong button.
  if (body.action === 'recover' && enrollment && enrollment.provider !== provider) {
    return NextResponse.json(
      {
        error: 'provider_mismatch',
        detail: `This wallet's recovery was set up with ${enrollment.provider}. Sign in with ${enrollment.provider} to recover it.`,
        enrolled_provider: enrollment.provider,
      },
      { status: 409 },
    )
  }

  // Abuse control. The enclave costs nothing per request now, but a public app
  // id should still not be able to drive unbounded work.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: walletStarts } = await admin
    .from('social_recovery_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_id', wallet.id)
    .gte('created_at', hourAgo)
  if ((walletStarts || 0) >= 10) {
    return NextResponse.json({ error: 'recovery_rate_limited' }, { status: 429 })
  }

  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()
  const { error: insertError } = await admin.from('social_recovery_sessions').insert({
    id: sessionId,
    wallet_id: wallet.id,
    app_id: appId,
    environment_id: environment.id,
    action: body.action,
    // The provider this session is actually for, not the environment's legacy
    // fallback. Recording the fallback here would make the session row disagree
    // with the policy the enclave was handed.
    provider,
    delay_seconds: environmentPolicy.social_recovery_delay_seconds,
    auth_challenge_hash: authChallengeHash,
    status: 'ready',
    expires_at: expiresAt,
  })
  if (insertError) {
    const conflict = insertError.code === '23505'
    return NextResponse.json(
      { error: conflict ? 'auth_credential_replayed' : 'session_create_failed' },
      { status: conflict ? 409 : 500 },
    )
  }

  let opened
  try {
    opened = await openSession(sessionId)
  } catch (error) {
    // Mark the row terminal so the challenge is released and the browser can
    // retry immediately with the same credential.
    await admin
      .from('social_recovery_sessions')
      .update({ status: 'failed', error_code: 'enclave_unavailable' })
      .eq('id', sessionId)
    console.error('[social-recovery] enclave openSession failed', error)
    return NextResponse.json({ error: 'enclave_unavailable' }, { status: 503 })
  }

  const sealedRecord =
    body.action === 'recover'
      ? (
          await admin
            .from('social_recovery_enrollments')
            .select('sealed_record')
            .eq('wallet_id', wallet.id)
            .maybeSingle()
        ).data?.sealed_record
      : undefined

  return NextResponse.json({
    session_id: sessionId,
    status: 'ready',
    action: body.action,
    // The SDK builds the job's credential from this field, and the enclave
    // refuses a job whose credential provider differs from its policy — the
    // first thing it checks, before it even fetches the JWKS. Returning the
    // environment's legacy fallback here meant a user who signed in with Apple
    // got an Apple policy alongside a credential labelled google, and the
    // enclave rejected it as `request_failed` with nothing to say about why.
    provider,
    policy,
    delay_seconds: environmentPolicy.social_recovery_delay_seconds,
    expires_at: expiresAt,
    ephemeral_public_key_b64: opened.ephemeral_public_key_b64,
    attestation_document_b64: opened.attestation_document_b64,
    ...(sealedRecord ? { sealed_record_b64: sealedRecord } : {}),
  })
}
