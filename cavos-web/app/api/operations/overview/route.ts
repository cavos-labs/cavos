import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WINDOW_HOURS: Record<string, number> = { '24h': 24, '7d': 168, '30d': 720, '90d': 2160 }

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized', request_id: requestId }, { status: 401 })

  const params = new URL(request.url).searchParams
  const range = params.get('range') ?? '7d'
  const hours = WINDOW_HOURS[range] ?? WINDOW_HOURS['7d']
  const since = new Date(Date.now() - hours * 3_600_000).toISOString()
  const previousSince = new Date(Date.now() - hours * 2 * 3_600_000).toISOString()
  const appId = params.get('app_id')
  const environmentId = params.get('environment_id')
  const network = params.get('network')

  let walletsTotal = supabase.from('wallets').select('*', { count: 'exact', head: true })
  let walletsCurrent = supabase.from('wallets').select('*', { count: 'exact', head: true }).gte('created_at', since)
  let walletsPrevious = supabase.from('wallets').select('*', { count: 'exact', head: true }).gte('created_at', previousSince).lt('created_at', since)
  let events = supabase.from('cavos_events').select('status,duration_ms,event_type,severity,network,error_code,tx_reference,created_at').gte('created_at', since)
  for (const [key, value] of [['app_id', appId], ['environment_id', environmentId], ['network', network]] as const) {
    if (value) {
      if (key !== 'network' || true) {
        walletsTotal = walletsTotal.eq(key, value)
        walletsCurrent = walletsCurrent.eq(key, value)
        walletsPrevious = walletsPrevious.eq(key, value)
      }
      events = events.eq(key, value)
    }
  }

  const [totalResult, currentResult, previousResult, eventResult] = await Promise.all([walletsTotal, walletsCurrent, walletsPrevious, events])
  const eventRows = eventResult.data ?? []
  const successes = eventRows.filter((event) => event.status === 'success').length
  const failures = eventRows.filter((event) => event.status === 'failed').length
  const durations = eventRows.flatMap((event) => typeof event.duration_ms === 'number' ? [event.duration_ms] : []).sort((a, b) => a - b)
  const percentile = (p: number) => durations.length ? durations[Math.min(durations.length - 1, Math.floor(durations.length * p))] : null
  const critical = eventRows.some((event) => event.severity === 'critical' && event.status === 'failed')
  const failureRate = successes + failures ? failures / (successes + failures) : 0

  const groupBy = (key: 'event_type' | 'network') => {
    const map = new Map<string, { key: string; total: number; failures: number }>()
    for (const event of eventRows) {
      const value = (event[key] as string | null) ?? 'unknown'
      const bucket = map.get(value) ?? { key: value, total: 0, failures: 0 }
      bucket.total += 1
      if (event.status === 'failed') bucket.failures += 1
      map.set(value, bucket)
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  }

  const recentFailures = eventRows
    .filter((event) => event.status === 'failed')
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6)
    .map((event) => ({ event_type: event.event_type, network: event.network ?? null, error_code: event.error_code ?? null, tx_reference: event.tx_reference ?? null, created_at: event.created_at }))

  return NextResponse.json({
    request_id: requestId,
    range,
    wallets: {
      total: totalResult.count ?? 0,
      new: currentResult.count ?? 0,
      previous: previousResult.count ?? 0,
    },
    events: {
      total: eventRows.length,
      successes,
      failures,
      success_rate: successes + failures ? successes / (successes + failures) : null,
      latency_p50_ms: percentile(.5),
      latency_p95_ms: percentile(.95),
    },
    health: critical || failureRate >= .2 ? 'action_required' : failureRate >= .05 ? 'degraded' : 'healthy',
    by_type: groupBy('event_type'),
    by_network: groupBy('network'),
    recent_failures: recentFailures,
  })
}
