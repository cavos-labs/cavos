import { NextResponse } from 'next/server'
import { organizationForApp } from '@/lib/operations/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptJson } from '@/lib/oauth/encryption'

const SOCIAL_RECOVERY_PROVIDERS = ['google', 'apple', 'email', 'github']

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await organizationForApp(id)
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { data, error } = await access.supabase
    .from('app_environments')
    .select('id,public_id,kind,is_active,allowed_origins,low_balance_threshold_usd,social_recovery_enabled,social_recovery_provider,social_recovery_audiences,github_client_id,github_client_secret_ciphertext,created_at,updated_at')
    .eq('app_id', id)
    .order('kind', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const environments = (data ?? []).map(
    ({ github_client_secret_ciphertext, ...environment }) => ({
      ...environment,
      github_client_secret_set: !!github_client_secret_ciphertext,
    }),
  )
  return NextResponse.json({ environments })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await organizationForApp(id)
  if (!access || !['owner', 'admin', 'developer'].includes(access.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  if (!body.environment_id) return NextResponse.json({ error: 'environment_id is required' }, { status: 400 })
  const { data: currentEnvironment } = await access.supabase
    .from('app_environments')
    .select('id,social_recovery_enabled,social_recovery_provider,social_recovery_audiences,github_client_id,github_client_secret_ciphertext')
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
      !SOCIAL_RECOVERY_PROVIDERS.includes(body.social_recovery_provider)
    ) {
      return NextResponse.json({ error: 'Invalid social recovery provider' }, { status: 400 })
    }
    updates.social_recovery_provider = body.social_recovery_provider
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
  if (body.github_client_id !== undefined || body.github_client_secret !== undefined) {
    const clientId = body.github_client_id
    const clientSecret = body.github_client_secret
    if (clientId !== undefined && clientId !== null && typeof clientId !== 'string') {
      return NextResponse.json({ error: 'Invalid GitHub client ID' }, { status: 400 })
    }
    if (clientSecret !== undefined && clientSecret !== null && typeof clientSecret !== 'string') {
      return NextResponse.json({ error: 'Invalid GitHub client secret' }, { status: 400 })
    }
    const trimmedId = typeof clientId === 'string' ? clientId.trim() : clientId
    if (typeof trimmedId === 'string' && trimmedId.length > 255) {
      return NextResponse.json({ error: 'GitHub client ID is too long' }, { status: 400 })
    }
    if (typeof clientSecret === 'string' && clientSecret.length > 255) {
      return NextResponse.json({ error: 'GitHub client secret is too long' }, { status: 400 })
    }
    if (clientId === null || trimmedId === '') {
      updates.github_client_id = null
      updates.github_client_secret_ciphertext = null
    } else {
      const effectiveId = typeof trimmedId === 'string' ? trimmedId : currentEnvironment.github_client_id
      const hasNewSecret = typeof clientSecret === 'string' && clientSecret !== ''
      if (typeof trimmedId === 'string') updates.github_client_id = trimmedId
      if (hasNewSecret) updates.github_client_secret_ciphertext = encryptJson(clientSecret)
      if (effectiveId && !hasNewSecret && !currentEnvironment.github_client_secret_ciphertext) {
        return NextResponse.json({ error: 'A GitHub client secret is required with a client ID' }, { status: 400 })
      }
      if (!effectiveId && hasNewSecret) {
        return NextResponse.json({ error: 'A GitHub client ID is required with a client secret' }, { status: 400 })
      }
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No supported fields provided' }, { status: 400 })
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
  const { github_client_secret_ciphertext, ...environment } = data
  return NextResponse.json({
    environment: { ...environment, github_client_secret_set: !!github_client_secret_ciphertext },
  })
}
