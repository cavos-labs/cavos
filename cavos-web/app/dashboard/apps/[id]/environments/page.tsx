'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { EnvironmentBadge } from '@/components/EnvironmentBadge'
import { Icon } from '@/components/ui/Icon'

export default function EnvironmentsPage() {
  const { id } = useParams<{ id: string }>(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [copied, setCopied] = useState('')
  useEffect(() => { fetch(`/api/apps/${id}/environments`).then(r => r.json()).then(d => setItems(d.environments ?? [])).finally(() => setLoading(false)) }, [id])
  if (loading) return <PageSkeleton />
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); setCopied(value); setTimeout(() => setCopied(''), 1500) }
  return <div className="space-y-6"><PageHeader title="Environments" subtitle="Development and Production keep configuration, credentials and operational data separate." />
    <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">{items.map(env => <section key={env.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><EnvironmentBadge kind={env.kind}/><h2 className="mt-3 text-base font-semibold">{env.kind === 'production' ? 'Production' : 'Development'}</h2><p className="mt-1 text-sm text-black/50">{env.kind === 'production' ? 'Existing App IDs resolve here for backwards compatibility.' : 'Use this environment for isolated integration testing.'}</p></div><span className={`text-xs font-semibold ${env.is_active ? 'text-emerald-700' : 'text-black/40'}`}>{env.is_active ? 'Active' : 'Inactive'}</span></div><div className="mt-5"><label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Environment ID</label><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2.5 font-mono text-xs text-black/65">{env.public_id}</code><button onClick={() => copy(env.public_id)} className="rounded-lg border border-line px-3 py-2.5 text-xs font-semibold transition-transform active:scale-[.97] focus-visible:outline-2 focus-visible:outline-brand">{copied === env.public_id ? <Icon.Check size={14}/> : <Icon.Copy size={14}/>}<span className="sr-only">Copy environment ID</span></button></div></div></section>)}</div>
  </div>
}
