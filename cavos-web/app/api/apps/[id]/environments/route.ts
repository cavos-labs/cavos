import { NextResponse } from 'next/server'
import { organizationForApp } from '@/lib/operations/access'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await organizationForApp(id)
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { data, error } = await access.supabase
    .from('app_environments')
    .select('id,public_id,kind,is_active,allowed_origins,low_balance_threshold_usd,social_recovery_enabled,social_recovery_provider,social_recovery_delay_seconds,social_recovery_audiences,created_at,updated_at')
    .eq('app_id', id)
    .order('kind', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ environments: data })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await organizationForApp(id)
  if (!access || !['owner', 'admin', 'developer'].includes(access.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  if (!body.environment_id) return NextResponse.json({ error: 'environment_id is required' }, { status: 400 })
  const { data: currentEnvironment } = await access.supabase
    .from('app_environments')
    .select('id,social_recovery_enabled,social_recovery_provider,social_recovery_delay_seconds,social_recovery_audiences')
    .eq('id', body.environment_id)
    .eq('app_id', id)
    .maybeSingle()
  if (!currentEnvironment) {
    return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
  }
  const updates: Record<string, unknown> = {}
  if (body.allowed_origins !== undefined) updates.allowed_origins = Array.isArray(body.allowed_origins) ? body.allowed_origins : []
  if (body.low_balance_threshold_usd !== undefined) updates.low_balance_threshold_usd = body.low_balance_threshold_usd
  if (body.social_recovery_enabled !== undefined) {
    if (typeof body.social_recovery_enabled !== 'boolean') {
      return NextResponse.json({ error: 'social_recovery_enabled must be boolean' }, { status: 400 })
    }
    updates.social_recovery_enabled = body.social_recovery_enabled
  }
  if (body.social_recovery_provider !== undefined) {
    if (
      body.social_recovery_provider !== null &&
      !['google', 'apple', 'email'].includes(body.social_recovery_provider)
    ) {
      return NextResponse.json({ error: 'Invalid social recovery provider' }, { status: 400 })
    }
    updates.social_recovery_provider = body.social_recovery_provider
  }
  if (body.social_recovery_delay_seconds !== undefined) {
    const delay = Number(body.social_recovery_delay_seconds)
    if (!Number.isInteger(delay) || delay < 0 || delay > 2_592_000) {
      return NextResponse.json({ error: 'Recovery delay must be between 0 and 2592000 seconds' }, { status: 400 })
    }
    updates.social_recovery_delay_seconds = delay
  }
  if (body.social_recovery_audiences !== undefined) {
    // Which client's id_tokens the enclave will accept, per provider. It is
    // stored here and only ever set by the app owner — never taken from a
    // recovery request, because it is what stops a token minted for someone
    // else's app from recovering a wallet in this one. An absent entry falls
    // back to Cavos's own client.
    //
    // Wallets already enrolled are unaffected either way: the enclave enforces
    // the policy sealed at enrolment, not whatever this says later.
    const raw = body.social_recovery_audiences
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return NextResponse.json({ error: 'Invalid recovery client configuration' }, { status: 400 })
    }
    const audiences: Record<string, string> = {}
    for (const [provider, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!['google', 'apple', 'email'].includes(provider)) {
        return NextResponse.json({ error: `Unknown provider "${provider}"` }, { status: 400 })
      }
      if (value === null || value === '') continue
      if (typeof value !== 'string') {
        return NextResponse.json({ error: `Invalid client ID for ${provider}` }, { status: 400 })
      }
      const trimmed = value.trim()
      if (!trimmed) continue
      if (trimmed.length > 255) {
        return NextResponse.json({ error: `Client ID for ${provider} is too long` }, { status: 400 })
      }
      audiences[provider] = trimmed
    }
    updates.social_recovery_audiences = audiences
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No supported fields provided' }, { status: 400 })
  }

  const nextDelay =
    updates.social_recovery_delay_seconds === undefined
      ? currentEnvironment.social_recovery_delay_seconds
      : updates.social_recovery_delay_seconds
  // Only the timelock is guarded now. The provider used to be an environment-
  // wide setting and changing it retargeted every future enrolment, so it was
  // held still while records existed; it is now a property of each credential
  // and each wallet keeps the one it sealed, so there is nothing to strand.
  const policyChanged = nextDelay !== currentEnvironment.social_recovery_delay_seconds
  if (policyChanged) {
    // The timelock is sealed into the enclave record and enrolled on-chain.
    // Mutating it in place would strand already-enrolled wallets.
    const admin = createAdminClient()
    const { count, error: countError } = await admin
      .from('social_recovery_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('environment_id', body.environment_id)
      .in('onchain_status', ['pending', 'active'])
    if (countError) {
      return NextResponse.json({ error: 'Could not validate recovery policy usage' }, { status: 500 })
    }
    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          error:
            'The timelock cannot change while recovery enrollments exist. Disable recovery or create a new environment, and enrolled wallets keep the timelock they enrolled with.',
        },
        { status: 409 },
      )
    }
  }
  // The write goes through the admin client because `app_environments` carries
  // RLS with a read policy and no write policy ("Members read app
  // environments" is the only one). Under the member-scoped client the UPDATE
  // matches zero rows and PostgREST answers `.single()` with "Cannot coerce the
  // result to a single JSON object" — a save that silently does nothing and
  // reports a parsing error.
  //
  // Authorisation is not weakened by this: `organizationForApp` has already
  // established membership, the role check above restricts writes to
  // owner/admin/developer, and the filters below keep the update inside the one
  // environment of the one app named in the path.
  const { data, error } = await createAdminClient()
    .from('app_environments')
    .update(updates)
    .eq('id', body.environment_id)
    .eq('app_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ environment: data })
}
