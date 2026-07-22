'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { NetworkBadge } from '@/components/NetworkBadge'

export default function ActivityPage() {
  const [events, setEvents] = useState<any[]>([]), [loading, setLoading] = useState(true), [search, setSearch] = useState(''), [status, setStatus] = useState('')
  useEffect(() => { const q = new URLSearchParams(); if (search) q.set('search', search); if (status) q.set('status', status); const timer = setTimeout(() => fetch(`/api/operations/events?${q}`).then(r => r.json()).then(d => setEvents(d.events ?? [])).finally(() => setLoading(false)), 200); return () => clearTimeout(timer) }, [search, status])
  if (loading && !events.length) return <PageSkeleton />
  return <div className="space-y-6"><PageHeader title="Activity" subtitle="Operational events produced or coordinated by Cavos. Retained for 30 days." />
    <div className="flex flex-col gap-3 sm:flex-row"><input aria-label="Search by request or transaction reference" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search request ID or transaction reference" className="min-w-0 flex-1 rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"/><select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"><option value="">All statuses</option><option value="success">Success</option><option value="failed">Failed</option><option value="pending">Pending</option></select></div>
    <EventTable events={events} />
  </div>
}

export function EventTable({ events }: { events: any[] }) {
  if (!events.length) return <div className="rounded-xl border border-dashed border-line-strong bg-white py-16 text-center"><p className="text-sm font-semibold">No Cavos events found</p><p className="mt-1 text-xs text-black/45">Events appear when Cavos processes wallet, device, recovery or relay operations.</p></div>
  return <div className="overflow-x-auto rounded-xl border border-line bg-white"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-line bg-surface"><Th>Event</Th><Th>Status</Th><Th>Network</Th><Th>Request</Th><Th>Latency</Th><Th>Time</Th></tr></thead><tbody>{events.map(event => <tr key={event.id} className="border-b border-line/70 last:border-0 hover:bg-surface/70"><td className="px-4 py-3"><p className="text-xs font-semibold">{event.event_type}</p>{event.error_code && <p className="mt-1 text-xs text-red-700">{event.error_code}</p>}</td><td className="px-4 py-3"><Status value={event.status} /></td><td className="px-4 py-3">{event.network ? <NetworkBadge network={event.network} /> : <span className="text-xs text-black/35">—</span>}</td><td className="max-w-48 truncate px-4 py-3 font-mono text-[11px] text-black/50" title={event.request_id}>{event.request_id ?? '—'}</td><td className="px-4 py-3 font-mono text-xs text-black/55">{event.duration_ms == null ? '—' : `${event.duration_ms} ms`}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-black/50">{new Date(event.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
}
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-black/45">{children}</th> }
function Status({ value }: { value: string }) { const cls = value === 'success' ? 'bg-emerald-50 text-emerald-800' : value === 'failed' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'; return <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${cls}`}>{value}</span> }
