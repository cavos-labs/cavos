'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { PageSkeleton } from '@/components/ui/Skeleton'

type Breakdown = { key: string; total: number; failures: number }
type Failure = { event_type: string; network: string | null; error_code: string | null; tx_reference: string | null; created_at: string }
type Overview = {
  wallets: { total: number; new: number; previous: number }
  events: { total: number; successes: number; failures: number; success_rate: number | null; latency_p50_ms: number | null; latency_p95_ms: number | null }
  health: 'healthy' | 'degraded' | 'action_required'
  by_type: Breakdown[]
  by_network: Breakdown[]
  recent_failures: Failure[]
}

const healthCopy = {
  healthy: { label: 'Healthy', className: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  degraded: { label: 'Degraded', className: 'text-amber-800 bg-amber-50 border-amber-200' },
  action_required: { label: 'Action required', className: 'text-red-800 bg-red-50 border-red-200' },
}

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [apps, setApps] = useState<any[]>([])
  const [range, setRange] = useState('7d')
  const [appId, setAppId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetch('/api/apps').then(r => r.ok ? r.json() : null).then(d => setApps(d?.apps ?? [])) }, [])
  useEffect(() => {
    setLoading(true); setError('')
    const query = new URLSearchParams({ range }); if (appId) query.set('app_id', appId)
    fetch(`/api/operations/overview?${query}`).then(async r => { if (!r.ok) throw new Error(); setData(await r.json()) }).catch(() => setError('We could not load operational metrics. Try again.')).finally(() => setLoading(false))
  }, [range, appId])

  const change = useMemo(() => {
    if (!data?.wallets.previous) return null
    return Math.round(((data.wallets.new - data.wallets.previous) / data.wallets.previous) * 100)
  }, [data])

  if (loading && !data) return <PageSkeleton />
  const health = healthCopy[data?.health ?? 'healthy']
  return <div className="space-y-6">
    <PageHeader title="Overview" subtitle="Operational state across your Cavos integrations." actions={<Link href="/dashboard/apps/new"><Button size="sm" variant="primary" icon={<Icon.Add size={15} />}>New app</Button></Link>} />

    <section aria-label="Dashboard filters" className="flex flex-wrap items-center gap-3 border-y border-line py-3">
      <label className="text-xs font-semibold text-black/60" htmlFor="app-filter">App</label>
      <select id="app-filter" value={appId} onChange={e => setAppId(e.target.value)} className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand">
        <option value="">All apps</option>{apps.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}
      </select>
      <div className="ml-auto flex rounded-lg border border-line bg-surface p-0.5" aria-label="Date range">
        {['24h','7d','30d','90d'].map(value => <button key={value} onClick={() => setRange(value)} aria-pressed={range === value} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-[background-color,color,transform] duration-150 active:scale-[.97] focus-visible:outline-2 focus-visible:outline-brand ${range === value ? 'bg-white text-ink shadow-sm' : 'text-black/50 hover:text-black'}`}>{value}</button>)}
      </div>
    </section>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

    <section aria-label="Operational metrics" className="grid overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-2 lg:grid-cols-4 sm:divide-x divide-line">
      <Metric label="Total wallets" value={data?.wallets.total ?? '—'} note="Historical" />
      <Metric label={`New wallets · ${range}`} value={data?.wallets.new ?? '—'} note={change === null ? 'No prior baseline' : `${change >= 0 ? '+' : ''}${change}% vs prior period`} />
      <Metric label="Success rate" value={data?.events.success_rate == null ? '—' : `${Math.round(data.events.success_rate * 100)}%`} note={`${data?.events.total ?? 0} Cavos events`} />
      <div className="p-5"><p className="text-xs font-medium text-black/55">Integration health</p><span className={`mt-4 inline-flex rounded-md border px-2.5 py-1.5 text-sm font-semibold ${health.className}`}>{health.label}</span><p className="mt-3 text-xs text-black/45">Based on explicit operational checks.</p></div>
    </section>

    <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
      <section className="rounded-xl border border-line bg-white p-5">
        <div className="flex items-center justify-between border-b border-line pb-4"><div><h2 className="text-sm font-semibold">Operational performance</h2><p className="mt-1 text-xs text-black/50">Only activity processed by Cavos.</p></div><Link href="/dashboard/activity" className="text-xs font-semibold text-brand hover:underline">View activity</Link></div>
        <dl className="mt-5 grid gap-5 sm:grid-cols-3">
          <DataPoint label="Successful" value={data?.events.successes ?? 0} />
          <DataPoint label="Failed" value={data?.events.failures ?? 0} />
          <DataPoint label="Latency p95" value={data?.events.latency_p95_ms == null ? 'Not enough data' : `${data.events.latency_p95_ms} ms`} />
        </dl>
      </section>
      <section className="rounded-xl border border-line bg-white p-5"><h2 className="text-sm font-semibold">Scope</h2><p className="mt-3 text-sm leading-6 text-black/55">Cavos reports wallet registration, devices, recovery, relay decisions and sponsorship. For balances and external activity, use the network explorer.</p></section>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <Breakdown title="Operations by type" subtitle="Which flows Cavos handled." rows={data?.by_type ?? []} labelFormat={humanize} />
      <Breakdown title="Wallets by network" subtitle="Multichain distribution." rows={data?.by_network ?? []} labelFormat={v => v === 'unknown' ? 'Unspecified' : v} />
    </div>

    <section className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center justify-between border-b border-line pb-4"><div><h2 className="text-sm font-semibold">Recent failures</h2><p className="mt-1 text-xs text-black/50">Newest failed operations in this window — start here when debugging.</p></div><Link href="/dashboard/activity" className="text-xs font-semibold text-brand hover:underline">All activity</Link></div>
      {data?.recent_failures.length ? <ul className="mt-2 divide-y divide-line/70">{data.recent_failures.map((failure, index) => <li key={index} className="flex items-center gap-3 py-3">
        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{humanize(failure.event_type)}{failure.network && <span className="ml-2 rounded bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-black/55 capitalize">{failure.network}</span>}</p>{(failure.error_code || failure.tx_reference) && <p className="mt-0.5 truncate font-mono text-xs text-black/45">{failure.error_code ?? ''}{failure.error_code && failure.tx_reference ? ' · ' : ''}{failure.tx_reference ?? ''}</p>}</div>
        <time className="shrink-0 text-xs text-black/40">{new Date(failure.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
      </li>)}</ul> : <p className="py-8 text-center text-sm text-black/45">No failed operations in this window. Nice.</p>}
    </section>
  </div>
}

function humanize(value: string) { return value.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }

function Breakdown({ title, subtitle, rows, labelFormat }: { title: string; subtitle: string; rows: Breakdown[]; labelFormat: (value: string) => string }) {
  const max = Math.max(1, ...rows.map(row => row.total))
  return <section className="rounded-xl border border-line bg-white p-5">
    <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-black/50">{subtitle}</p></div>
    {rows.length ? <ul className="mt-4 space-y-3">{rows.map(row => <li key={row.key}>
      <div className="flex items-baseline justify-between gap-3 text-sm"><span className="truncate font-medium">{labelFormat(row.key)}</span><span className="shrink-0 font-mono tabular-nums text-black/55">{row.total}{row.failures > 0 && <span className="ml-1.5 text-xs text-red-600">· {row.failures} failed</span>}</span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-brand" style={{ width: `${(row.total / max) * 100}%` }} /></div>
    </li>)}</ul> : <p className="py-8 text-center text-sm text-black/45">No events in this window yet.</p>}
  </section>
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) { return <div className="border-b border-line p-5 last:border-b-0 sm:border-b-0"><p className="text-xs font-medium text-black/55">{label}</p><p className="mt-4 font-mono text-3xl font-semibold tabular-nums">{value}</p><p className="mt-2 text-xs text-black/45">{note}</p></div> }
function DataPoint({ label, value }: { label: string; value: string | number }) { return <div><dt className="text-xs text-black/45">{label}</dt><dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</dd></div> }
