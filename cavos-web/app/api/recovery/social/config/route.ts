import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const appId = url.searchParams.get('app_id')
  const environmentHint =
    url.searchParams.get('environment_id') || url.searchParams.get('environment') || undefined
  if (!appId) return NextResponse.json({ error: 'app_id_required' }, { status: 400 })
  const resolved = await resolveAppIdentifier(appId, environmentHint)
  if (!resolved?.environmentId) return NextResponse.json({ error: 'environment_not_found' }, { status: 404 })
  const admin = createAdminClient()
  const { data } = await admin
    .from('app_environments')
    .select(
      'id, social_recovery_enabled, social_recovery_provider, social_recovery_delay_seconds',
    )
    .eq('id', resolved.environmentId)
    .eq('app_id', resolved.appId)
    .single()
  if (!data) return NextResponse.json({ error: 'environment_not_found' }, { status: 404 })
  return NextResponse.json({
    enabled: data.social_recovery_enabled,
    // Every provider the enclave can verify is available once recovery is on;
    // which one a wallet uses is decided by the credential at enrolment, not
    // here. `provider` is kept for SDK versions that read a single value —
    // they send no provider of their own, and the session falls back to it.
    providers: PROVIDERS,
    provider: data.social_recovery_provider,
    delay_seconds: data.social_recovery_delay_seconds,
    // The configured audiences are deliberately absent. They are not secret,
    // but the client has no use for them — the policy is assembled server-side
    // precisely so a frontend cannot influence whose tokens are accepted.
  })
}

const PROVIDERS = ['google', 'apple', 'email'] as const
