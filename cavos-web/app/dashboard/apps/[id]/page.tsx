'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { EnvironmentBadge } from '@/components/EnvironmentBadge'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Panel } from '@/components/ui/Panel'

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

export default function AppOverviewPage() {
  const { id } = useParams<{ id: string }>()
  const [app, setApp] = useState<any>()
  const [envs, setEnvs] = useState<any[]>([])
  const [health, setHealth] = useState<any>()
  const [data, setData] = useState<Overview | null>(null)
  const [range, setRange] = useState('7d')
  const [appLoading, setAppLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    setAppLoading(true)
    setApp(undefined)
    Promise.all([
      fetch(`/api/apps/${id}`).then(async (r) => {
        if (!r.ok) throw new Error()
        return r.json()
      }),
      fetch(`/api/apps/${id}/environments`).then((r) => r.ok ? r.json() : { environments: [] }),
      fetch(`/api/apps/${id}/health`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([a, e, h]) => {
        if (cancelled) return
        setApp(a.app ?? null)
        setEnvs(e.environments ?? [])
        setHealth(h)
      })
      .catch(() => {
        if (cancelled) return
        setApp(null)
      })
      .finally(() => {
        if (!cancelled) setAppLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    setError('')
    const query = new URLSearchParams({ range, app_id: id })
    fetch(`/api/operations/overview?${query}`)
      .then(async (r) => {
        if (!r.ok) throw new Error()
        setData(await r.json())
      })
      .catch(() => setError('We could not load operational metrics. Try again.'))
  }, [id, range])

  const change = useMemo(() => {
    if (!data?.wallets.previous) return null
    return Math.round(((data.wallets.new - data.wallets.previous) / data.wallets.previous) * 100)
  }, [data])

  if (appLoading) return <PageSkeleton />
  if (!app) return <div role="alert" className="border-l-2 border-red-600 bg-white p-5 text-sm text-red-700">Application could not be loaded.</div>

  const production = envs.find((e) => e.kind === 'production')
  const passed = health?.passed ?? 0
  const total = health?.total ?? 0
  const percentage = total ? Math.round((passed / total) * 100) : 0
  const healthy = passed === total
  const degraded = !healthy && passed >= total - 2
  const status = healthy ? 'Healthy' : degraded ? 'Degraded' : 'Action required'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Application"
        title={app.name}
        subtitle={app.description || 'Operational state and configuration for this app.'}
        actions={
          <Link
            href={`/dashboard/apps/${id}/settings`}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-semibold hover:border-line-strong hover:bg-surface"
          >
            <Icon.Settings size={15} />
            Configure
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3 border-y border-line py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
            {app.logo_url ? <Image src={app.logo_url} alt="" fill className="object-cover" /> : <div className="flex h-full items-center justify-center bg-surface"><Icon.Apps size={14} className="text-muted" /></div>}
          </div>
          <EnvironmentBadge kind="production" />
        </div>
        <div className="ml-auto flex rounded-lg border border-line bg-surface p-0.5" aria-label="Date range">
          {['24h', '7d', '30d', '90d'].map((value) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              aria-pressed={range === value}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${range === value ? 'bg-white text-ink' : 'text-muted hover:text-ink'}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>}

      <section aria-label="Operational metrics" className="grid overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-2 lg:grid-cols-4 sm:divide-x divide-line">
        <Metric label="Total wallets" value={data?.wallets.total ?? '—'} note="Historical" />
        <Metric label={`New wallets · ${range}`} value={data?.wallets.new ?? '—'} note={change === null ? 'No prior baseline' : `${change >= 0 ? '+' : ''}${change}% vs prior period`} />
        <Metric label="Success rate" value={data?.events.success_rate == null ? '—' : `${Math.round(data.events.success_rate * 100)}%`} note={`${data?.events.total ?? 0} Cavos events`} />
        <div className="p-5">
          <p className="text-xs font-medium text-muted">Integration health</p>
          <Badge variant={healthy ? 'ok' : degraded ? 'warn' : 'danger'} className="mt-4 text-sm">{status}</Badge>
          <p className="mt-3 text-xs text-muted">Based on explicit configuration checks.</p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <Panel>
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-sm font-semibold">Operational performance</h2>
              <p className="mt-1 text-xs text-muted">Only activity processed by Cavos for this app.</p>
            </div>
            <Link href={`/dashboard/apps/${id}/activity`} className="text-xs font-semibold text-brand hover:underline">View activity</Link>
          </div>
          <dl className="mt-5 grid gap-5 sm:grid-cols-3">
            <DataPoint label="Successful" value={data?.events.successes ?? 0} />
            <DataPoint label="Failed" value={data?.events.failures ?? 0} />
            <DataPoint label="Latency p95" value={data?.events.latency_p95_ms == null ? 'Not enough data' : `${data.events.latency_p95_ms} ms`} />
          </dl>
        </Panel>
        <Panel>
          <h2 className="text-sm font-semibold">Production context</h2>
          <p className="mt-4 text-xs font-medium text-muted">Environment ID</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2.5 font-mono text-xs text-muted">{production?.public_id ?? app.id}</code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(production?.public_id ?? app.id)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              className="rounded-lg border border-line p-2.5 text-muted hover:text-ink"
              aria-label="Copy production environment ID"
            >
              {copied ? <Icon.Check size={15} className="text-emerald-700" /> : <Icon.Copy size={15} />}
            </button>
          </div>
          <Link href={`/dashboard/apps/${id}/environments`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
            Manage environments
            <Icon.ArrowRight size={13} />
          </Link>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="Operations by type" subtitle="Which flows Cavos handled." rows={data?.by_type ?? []} labelFormat={humanize} />
        <Breakdown title="Wallets by network" subtitle="Multichain distribution." rows={data?.by_network ?? []} labelFormat={(v) => v === 'unknown' ? 'Unspecified' : v} />
      </div>

      <Panel>
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="text-sm font-semibold">Recent failures</h2>
            <p className="mt-1 text-xs text-muted">Newest failed operations in this window.</p>
          </div>
          <Link href={`/dashboard/apps/${id}/activity`} className="text-xs font-semibold text-brand hover:underline">All activity</Link>
        </div>
        {data?.recent_failures.length ? (
          <ul className="mt-2 divide-y divide-line/70">
            {data.recent_failures.map((failure, index) => (
              <li key={index} className="flex items-center gap-3 py-3">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-sm bg-danger" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {humanize(failure.event_type)}
                    {failure.network && <span className="ml-2 rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted capitalize">{failure.network}</span>}
                  </p>
                  {(failure.error_code || failure.tx_reference) && (
                    <p className="mt-0.5 truncate font-mono text-xs text-muted">
                      {failure.error_code ?? ''}{failure.error_code && failure.tx_reference ? ' · ' : ''}{failure.tx_reference ?? ''}
                    </p>
                  )}
                </div>
                <time className="shrink-0 font-mono text-xs tabular-nums text-muted">
                  {new Date(failure.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted">No failed operations in this window.</p>
        )}
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Integration health</h2>
            <p className="mt-1 text-sm text-muted">{passed} of {total} configuration checks passed</p>
          </div>
          <Badge variant={healthy ? 'ok' : degraded ? 'warn' : 'danger'}>{status}</Badge>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/[0.06]" role="progressbar" aria-label="Integration health" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
          <div className="h-full rounded-full bg-brand" style={{ width: `${percentage}%` }} />
        </div>
        <div className="mt-4 divide-y divide-line/70">
          {health?.checks?.map((check: any) => (
            <Link
              key={check.id}
              href={check.href}
              className="group grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3.5 hover:bg-surface"
            >
              {check.passed ? <Icon.Check size={15} className="shrink-0 text-muted" /> : <Icon.Warning size={15} className="shrink-0 text-brand" />}
              <span className="min-w-0 truncate text-sm font-medium">{check.label}</span>
              <span className="flex items-center gap-3">
                <span className={`hidden text-xs font-medium sm:block ${check.passed ? 'text-muted' : 'text-brand'}`}>{check.passed ? 'Passed' : 'Review'}</span>
                <Icon.ChevronRight size={14} className="shrink-0 text-black/25" />
              </span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function humanize(value: string) {
  return value.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function Breakdown({ title, subtitle, rows, labelFormat }: { title: string; subtitle: string; rows: Breakdown[]; labelFormat: (value: string) => string }) {
  const max = Math.max(1, ...rows.map((row) => row.total))
  return (
    <Panel>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted">{subtitle}</p>
      </div>
      {rows.length ? (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{labelFormat(row.key)}</span>
                <span className="shrink-0 font-mono tabular-nums text-muted">
                  {row.total}
                  {row.failures > 0 && <span className="ml-1.5 text-xs text-danger">· {row.failures} failed</span>}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-surface">
                <div className="h-full rounded-sm bg-brand" style={{ width: `${(row.total / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-muted">No events in this window yet.</p>
      )}
    </Panel>
  )
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="border-b border-line p-5 last:border-b-0 sm:border-b-0">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-4 font-mono text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-2 text-xs text-muted">{note}</p>
    </div>
  )
}

function DataPoint({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
