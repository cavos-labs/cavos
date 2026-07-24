import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchEvent } from './webhooks'

const BLOCKED_KEYS = /email|secret|token|password|encrypted|private|pub_[xy]|blob/i

export function sanitizeEventMetadata(input: Record<string, unknown> = {}) {
  const sanitized: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(input)) {
    if (BLOCKED_KEYS.test(key)) continue
    if (typeof value === 'string') sanitized[key] = value.slice(0, 500)
    else if (typeof value === 'number' || typeof value === 'boolean' || value === null) sanitized[key] = value
  }
  return sanitized
}

export async function resolveEnvironment(appId: string, supplied?: string | null) {
  const admin = createAdminClient()
  if (supplied) {
    if (supplied === 'development' || supplied === 'production') {
      const { data } = await admin.from('app_environments').select('id, app_id, kind').eq('app_id', appId).eq('kind', supplied).maybeSingle()
      return data
    }
    const { data } = await admin.from('app_environments').select('id, app_id, kind').or(`id.eq.${supplied},public_id.eq.${supplied}`).maybeSingle()
    if (data?.app_id === appId) return data
    return null
  }
  const { data } = await admin.from('app_environments').select('id, app_id, kind').eq('app_id', appId).eq('kind', 'production').maybeSingle()
  return data
}

export async function recordCavosEvent(input: {
  appId: string
  environmentId?: string | null
  walletId?: string | null
  eventType: string
  status: 'pending' | 'success' | 'failed'
  severity?: 'info' | 'warning' | 'critical'
  network?: string | null
  requestId?: string | null
  txReference?: string | null
  durationMs?: number | null
  errorCode?: string | null
  metadata?: Record<string, unknown>
}) {
  try {
    const admin = createAdminClient()
    const { data: app } = await admin.from('apps').select('organization_id').eq('id', input.appId).single()
    if (!app) return
    const environment = await resolveEnvironment(input.appId, input.environmentId)
    // Plain insert: dedup is enforced by the partial unique index on (request_id, event_type)
    // WHERE request_id IS NOT NULL. A retry with the same request_id raises 23505, which we
    // treat as an already-recorded event. We cannot use upsert/onConflict here because Postgres
    // will not match a partial unique index in an ON CONFLICT clause (fails with 42P10).
    const { data: event, error } = await admin.from('cavos_events').insert({
      organization_id: app.organization_id,
      app_id: input.appId,
      environment_id: environment?.id ?? null,
      wallet_id: input.walletId ?? null,
      event_type: input.eventType,
      status: input.status,
      severity: input.severity ?? (input.status === 'failed' ? 'warning' : 'info'),
      network: input.network ?? null,
      request_id: input.requestId ?? null,
      tx_reference: input.txReference?.slice(0, 180) ?? null,
      duration_ms: input.durationMs ?? null,
      error_code: input.errorCode?.slice(0, 100) ?? null,
      metadata: sanitizeEventMetadata(input.metadata),
    }).select().maybeSingle()
    if (error) {
      if (error.code === '23505') return // duplicate (request_id, event_type) retry — already recorded
      throw error
    }
    if (event?.environment_id) await dispatchEvent(event)
  } catch (error) {
    console.error('Operational event recording failed', error)
  }
}

export function maskExternalId(value?: string | null) {
  if (!value) return null
  if (value.length <= 8) return `${value.slice(0, 2)}••••${value.slice(-2)}`
  return `${value.slice(0, 4)}••••••${value.slice(-4)}`
}
