import { NextResponse } from 'next/server'
import { organizationForApp } from '@/lib/operations/access'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await organizationForApp(id)
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { data, error } = await access.supabase
    .from('app_environments')
    .select('id,public_id,kind,is_active,allowed_origins,low_balance_threshold_usd,social_recovery_enabled,social_recovery_provider,social_recovery_delay_seconds,social_recovery_audience,created_at,updated_at')
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
    .select('id,social_recovery_enabled,social_recovery_provider,social_recovery_delay_seconds,social_recovery_audience')
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
  if (body.social_recovery_audience !== undefined) {
    // The audience decides whose id_tokens the enclave will accept, so it is
    // stored per environment and only ever set by the app owner here — never
    // taken from a recovery request. An empty value falls back to the Cavos
    // client. Wallets already enrolled are unaffected: the enclave enforces the
    // policy sealed at enrolment.
    const raw = body.social_recovery_audience
    if (raw !== null && typeof raw !== 'string') {
      return NextResponse.json({ error: 'Invalid OAuth client ID' }, { status: 400 })
    }
    const audience = typeof raw === 'string' ? raw.trim() : null
    if (audience && audience.length > 255) {
      return NextResponse.json({ error: 'OAuth client ID is too long' }, { status: 400 })
    }
    updates.social_recovery_audience = audience || null
  }
  if (
    (updates.social_recovery_enabled ?? currentEnvironment.social_recovery_enabled) === true &&
    !['google', 'apple', 'email'].includes(
      String(updates.social_recovery_provider ?? currentEnvironment.social_recovery_provider ?? ''),
    )
  ) {
    return NextResponse.json(
      { error: 'Exactly one social recovery provider is required when enabled' },
      { status: 400 },
    )
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No supported fields provided' }, { status: 400 })
  }

  const nextProvider =
    updates.social_recovery_provider === undefined
      ? currentEnvironment.social_recovery_provider
      : updates.social_recovery_provider
  const nextDelay =
    updates.social_recovery_delay_seconds === undefined
      ? currentEnvironment.social_recovery_delay_seconds
      : updates.social_recovery_delay_seconds
  const policyChanged =
    nextProvider !== currentEnvironment.social_recovery_provider ||
    nextDelay !== currentEnvironment.social_recovery_delay_seconds
  if (policyChanged) {
    // The provider and timelock are sealed into the enclave record and enrolled
    // on-chain. Mutating either in place would strand already-enrolled wallets.
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
            'Provider and timelock cannot change while recovery enrollments exist. Disable recovery or create a new environment policy; enrolled wallets keep their current policy.',
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
