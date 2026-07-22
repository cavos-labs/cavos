'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { EnvironmentBadge } from '@/components/EnvironmentBadge'
import { Icon } from '@/components/ui/Icon'
import Image from 'next/image'

export default function AppOverviewPage() {
  const { id } = useParams<{ id: string }>(); const [app,setApp]=useState<any>(); const [envs,setEnvs]=useState<any[]>([]); const [health,setHealth]=useState<any>(); const [loading,setLoading]=useState(true); const [copied,setCopied]=useState(false)
  useEffect(()=>{Promise.all([fetch(`/api/apps/${id}`).then(r=>r.json()),fetch(`/api/apps/${id}/environments`).then(r=>r.json()),fetch(`/api/apps/${id}/health`).then(r=>r.json())]).then(([a,e,h])=>{setApp(a.app);setEnvs(e.environments??[]);setHealth(h)}).finally(()=>setLoading(false))},[id])
  if(loading)return <PageSkeleton/>; if(!app)return <div role="alert" className="border-l-2 border-red-600 bg-white p-5 text-sm text-red-700">Application could not be loaded.</div>
  const production=envs.find(e=>e.kind==='production'); const passed=health?.passed??0,total=health?.total??0
  const percentage=total?Math.round((passed/total)*100):0
  const healthy=passed===total; const degraded=!healthy&&passed>=total-2
  const status=healthy?'Healthy':degraded?'Degraded':'Action required'
  const statusClass=healthy?'text-black/55':degraded?'text-black/65':'text-red-700'
  const statusDot=healthy?'bg-black/45':degraded?'bg-brand':'bg-red-600'
  return <div className="space-y-5 sm:space-y-6">
    <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
          {app.logo_url?<Image src={app.logo_url} alt="" fill className="object-cover"/>:<div className="flex h-full items-center justify-center bg-brand-soft"><Icon.Apps size={22} className="text-brand"/></div>}
        </div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-bold tracking-tight">{app.name}</h1><EnvironmentBadge kind="production"/></div><p className="mt-1 max-w-2xl text-sm text-black/50">{app.description||'Operational overview and integration health.'}</p></div>
      </div>
      <Link href={`/dashboard/apps/${id}/settings`} className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-line bg-white px-3 text-xs font-semibold transition-[background-color,border-color,transform] duration-150 hover:border-line-strong hover:bg-surface active:scale-[.98] focus-visible:outline-2 focus-visible:outline-brand"><Icon.Settings size={15}/>Configure</Link>
    </header>

    <div className="grid overflow-hidden rounded-xl border border-line bg-white lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0">
        <div className="border-b border-line p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-base font-semibold tracking-tight">Integration health</h2><p className="mt-1 text-sm text-black/50">{passed} of {total} configuration checks passed</p></div><span className={`inline-flex items-center gap-2 pt-1 text-xs font-semibold ${statusClass}`}><span className={`h-2 w-2 ${statusDot}`}/>{status}</span></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/[0.06]" role="progressbar" aria-label="Integration health" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{width:`${percentage}%`}}/></div>
        </div>
        <div className="divide-y divide-line/70">{health?.checks?.map((check:any)=><Link key={check.id} href={check.href} className="group grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand sm:px-6">{check.passed?<Icon.Check size={15} className="shrink-0 text-black/35"/>:<Icon.Warning size={15} className="shrink-0 text-brand"/>}<span className="min-w-0 truncate text-sm font-medium">{check.label}</span><span className="flex items-center gap-3"><span className={`hidden text-xs font-medium sm:block ${check.passed?'text-black/40':'text-brand'}`}>{check.passed?'Passed':'Review'}</span><Icon.ChevronRight size={14} className="shrink-0 text-black/25 transition-transform duration-150 group-hover:translate-x-0.5"/></span></Link>)}</div>
      </section>

      <aside className="border-t border-line lg:border-l lg:border-t-0">
        <section className="p-5">
          <h2 className="text-sm font-semibold">Production context</h2>
          <p className="mt-5 text-xs font-medium text-black/50">Environment ID</p>
          <div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2.5 font-mono text-xs text-black/60">{production?.public_id??app.id}</code><button onClick={async()=>{await navigator.clipboard.writeText(production?.public_id??app.id);setCopied(true);setTimeout(()=>setCopied(false),1500)}} className="rounded-lg border border-line p-2.5 text-black/55 transition-colors hover:text-brand active:scale-[.97] focus-visible:outline-2 focus-visible:outline-brand" aria-label="Copy production environment ID">{copied?<Icon.Check size={15} className="text-emerald-700"/>:<Icon.Copy size={15}/>}</button></div>
          <dl className="mt-5 divide-y divide-line/70 border-y border-line/70 text-xs"><div className="flex items-center justify-between gap-3 py-3"><dt className="text-black/45">Default SDK context</dt><dd className="font-medium text-black/70">Production</dd></div><div className="flex items-center justify-between gap-3 py-3"><dt className="text-black/45">Legacy App ID</dt><dd className="font-medium text-black/70">Compatible</dd></div></dl>
          <Link href={`/dashboard/apps/${id}/environments`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">Manage environments<Icon.ArrowRight size={13}/></Link>
        </section>
        <section className="border-t border-line p-5"><h2 className="text-sm font-semibold">Developer tools</h2><div className="mt-3 divide-y divide-line/70"><ToolLink href={`/dashboard/apps/${id}/wallets`} icon={Icon.Wallet} label="Wallet support"/><ToolLink href={`/dashboard/apps/${id}/activity`} icon={Icon.Activity} label="Cavos activity"/><ToolLink href={`/dashboard/apps/${id}/emails`} icon={Icon.Mail} label="Email templates"/></div></section>
      </aside>
    </div>
  </div>
}
function ToolLink({href,icon:Glyph,label}:{href:string;icon:typeof Icon.Wallet;label:string}){return <Link href={href} className="group flex items-center gap-2.5 py-3 text-xs font-semibold text-black/60 transition-colors hover:text-brand"><Glyph size={15}/><span className="flex-1">{label}</span><Icon.ChevronRight size={13} className="text-black/25 transition-transform group-hover:translate-x-0.5"/></Link>}
