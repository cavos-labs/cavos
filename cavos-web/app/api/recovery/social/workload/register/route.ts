import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  deleteRecoveryVmHedges,
  getRecoveryVms,
} from '@/lib/recovery/social/google-compute'
import { verifyWorkloadAttestation } from '@/lib/recovery/social/attestation'
import {
  bearer,
  randomToken,
  sha256Base64url,
  tokenHash,
  tokenMatches,
} from '@/lib/recovery/social/security'

interface Registration {
  session_id?: string
  ephemeral_public_key_b64?: string
  attestation_token?: string
  attestation_nonce_b64?: string
}

export async function POST(request: Request) {
  const bootstrap = bearer(request)
  if (!bootstrap) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: Registration
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (
    !body.session_id ||
    !body.ephemeral_public_key_b64 ||
    !body.attestation_token ||
    !body.attestation_nonce_b64
  ) {
    return NextResponse.json({ error: 'registration_incomplete' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from('social_recovery_sessions')
    .select(
      'id, status, bootstrap_token_hash, vm_instance_name, expires_at',
    )
    .eq('id', body.session_id)
    .maybeSingle()
  if (
    !session ||
    session.status !== 'starting' ||
    !tokenMatches(bootstrap, session.bootstrap_token_hash) ||
    new Date(session.expires_at).getTime() <= Date.now()
  ) {
    return NextResponse.json({ error: 'registration_rejected' }, { status: 401 })
  }

  let ephemeralPublic: Buffer
  try {
    ephemeralPublic = Buffer.from(body.ephemeral_public_key_b64, 'base64url')
  } catch {
    return NextResponse.json({ error: 'invalid_ephemeral_key' }, { status: 400 })
  }
  if (ephemeralPublic.length !== 65 || ephemeralPublic[0] !== 4) {
    return NextResponse.json({ error: 'invalid_ephemeral_key' }, { status: 400 })
  }
  const expectedNonce = sha256Base64url(
    ephemeralPublic,
    Buffer.from(session.id, 'utf8'),
  )
  if (expectedNonce !== body.attestation_nonce_b64) {
    return NextResponse.json({ error: 'attestation_nonce_mismatch' }, { status: 400 })
  }

  try {
    const vms = await getRecoveryVms(session.vm_instance_name)
    let verified:
      | { vm: (typeof vms)[number]; claims: Awaited<ReturnType<typeof verifyWorkloadAttestation>> }
      | undefined
    let verificationError: unknown
    for (const vm of vms) {
      try {
        const claims = await verifyWorkloadAttestation({
          token: body.attestation_token,
          expectedNonce,
          expectedInstanceId: vm.id,
          expectedInstanceName: session.vm_instance_name,
        })
        verified = { vm, claims }
        break
      } catch (error) {
        verificationError = error
      }
    }
    if (!verified) throw verificationError || new Error('attested VM not found')
    const workloadToken = randomToken()
    const { data: claimed, error } = await admin
      .from('social_recovery_sessions')
      .update({
        status: 'ready',
        workload_token_hash: tokenHash(workloadToken),
        vm_instance_id: verified.vm.id,
        ephemeral_public_key: body.ephemeral_public_key_b64,
        attestation_nonce: expectedNonce,
        // The token contains no user credential or recovery secret. Retaining
        // it lets the SDK independently verify the enclave instead of trusting
        // this parsed representation.
        attestation_claims: { ...verified.claims, token: body.attestation_token },
        ready_at: new Date().toISOString(),
      })
      .eq('id', session.id)
      .eq('status', 'starting')
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!claimed) {
      return NextResponse.json({ error: 'registration_already_claimed' }, { status: 409 })
    }
    try {
      await deleteRecoveryVmHedges(session.vm_instance_name, verified.vm.id)
    } catch (error) {
      // Registration is already committed. A later post-provision cleanup and
      // scheduled cleanup both retry removal of non-attested hedges.
      console.error('[social-recovery] workload hedge cleanup failed', error)
    }
    return NextResponse.json({ workload_token: workloadToken })
  } catch (error) {
    console.error('[social-recovery] workload attestation rejected', error)
    await admin
      .from('social_recovery_sessions')
      .update({ status: 'failed', error_code: 'attestation_rejected' })
      .eq('id', session.id)
    return NextResponse.json({ error: 'attestation_rejected' }, { status: 401 })
  }
}
