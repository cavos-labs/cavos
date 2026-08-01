import { NextResponse } from 'next/server'
import { resolveEnvironment } from '@/lib/operations/events'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const appId = url.searchParams.get('app_id')
  const environmentHint =
    url.searchParams.get('environment_id') || url.searchParams.get('environment') || undefined
  if (!appId) return NextResponse.json({ error: 'app_id_required' }, { status: 400 })
  const environment = await resolveEnvironment(appId, environmentHint)
  if (!environment) return NextResponse.json({ error: 'environment_not_found' }, { status: 404 })
  const admin = createAdminClient()
  const { data } = await admin
    .from('app_environments')
    .select(
      'id, social_recovery_enabled, social_recovery_provider, social_recovery_delay_seconds',
    )
    .eq('id', environment.id)
    .eq('app_id', appId)
    .single()
  if (!data) return NextResponse.json({ error: 'environment_not_found' }, { status: 404 })
  return NextResponse.json({
    enabled: data.social_recovery_enabled,
    provider: data.social_recovery_provider,
    delay_seconds: data.social_recovery_delay_seconds,
  })
}
