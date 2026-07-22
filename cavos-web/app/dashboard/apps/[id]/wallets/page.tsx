'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { NetworkBadge } from '@/components/NetworkBadge'

export default function WalletsPage(){const{id}=useParams<{id:string}>();const[wallets,setWallets]=useState<any[]>([]);const[loading,setLoading]=useState(true);const[search,setSearch]=useState('');useEffect(()=>{fetch(`/api/apps/${id}/wallets`).then(r=>r.json()).then(d=>setWallets(d.wallets??[])).finally(()=>setLoading(false))},[id]);const filtered=useMemo(()=>wallets.filter(w=>w.address.toLowerCase().includes(search.toLowerCase())),[wallets,search]);if(loading)return <PageSkeleton/>;return <div className="space-y-6"><PageHeader title="Wallets" subtitle="Support view for wallets registered through Cavos."/><input aria-label="Search wallet address" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search wallet address" className="w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"/>{!filtered.length?<div className="rounded-xl border border-dashed border-line-strong bg-white py-16 text-center text-sm text-black/50">No wallets match this search.</div>:<div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">{filtered.map(w=><Link key={w.id} href={`/dashboard/apps/${id}/wallets/${w.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"><NetworkBadge network={w.network}/><code className="min-w-0 flex-1 truncate font-mono text-xs text-black/60">{w.address}</code><span className="text-xs text-black/40">{new Date(w.created_at).toLocaleDateString()}</span></Link>)}</div>}</div>}
