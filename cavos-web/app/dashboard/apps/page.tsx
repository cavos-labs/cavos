'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { AppWindow, Plus, Loader2, ArrowRight } from 'lucide-react'

export default function AppsPage() {
    const router = useRouter()
    const [apps, setApps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => { fetchApps() }, [])

    const fetchApps = async () => {
        try {
            const res = await fetch('/api/apps')
            if (!res.ok) {
                if (res.status === 401) { router.push('/login'); return }
                throw new Error('Failed to fetch apps')
            }
            const data = await res.json()
            setApps(data.apps || [])
        } catch {
            setError('Failed to load applications')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-6 h-6 animate-spin text-black/20" />
            </div>
        )
    }

    return (
        <div className="space-y-7 animate-fadeIn">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/30 mb-1.5">Dashboard</p>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Applications</h1>
                    <p className="text-xs text-black/40 mt-1 font-medium">Manage your apps with embedded wallets.</p>
                </div>
                <Link href="/dashboard/apps/new">
                    <Button icon={<Plus className="w-3.5 h-3.5" />}>
                        New Application
                    </Button>
                </Link>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Empty state */}
            {apps.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl bg-[#0A0908] text-white p-8 border border-black/10">
                    <div
                        className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at top right, #EAE5DC0C 0%, transparent 65%)' }}
                    />
                    <div className="relative space-y-4 max-w-md">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center">
                            <AppWindow className="w-5 h-5 text-white/50" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">No applications yet</h3>
                            <p className="text-sm text-white/40 leading-relaxed">
                                Create your first app to get an App ID and start integrating embedded wallets.
                            </p>
                        </div>
                        <Link href="/dashboard/apps/new">
                            <Button size="sm" className="bg-white/10 text-white hover:bg-white/16 border border-white/10 rounded-xl mt-1">
                                Create Application
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apps.map((app) => (
                        <Link key={app.id} href={`/dashboard/apps/${app.id}`}>
                            <div className="group h-full bg-white border border-black/[0.08] rounded-2xl p-6 hover:border-black/[0.18] hover:shadow-md hover:shadow-black/[0.05] transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    {/* App logo or fallback */}
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#F2EEE8] border border-[#EAE5DC] shrink-0 group-hover:border-[#C4BFB6] transition-colors">
                                        {app.logo_url ? (
                                            <Image
                                                src={app.logo_url}
                                                alt={app.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <AppWindow className="w-4 h-4 text-black/25" />
                                            </div>
                                        )}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-black/20 group-hover:text-black/50 transition-all group-hover:translate-x-0.5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-sm truncate">{app.name}</h3>
                                    {app.organization && (
                                        <p className="text-[10px] font-semibold text-black/30 uppercase tracking-wide truncate">
                                            {app.organization.name}
                                        </p>
                                    )}
                                    {app.description && (
                                        <p className="text-xs text-black/45 line-clamp-2 pt-1 leading-relaxed">
                                            {app.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Add new card */}
                    <Link href="/dashboard/apps/new">
                        <div className="group h-full min-h-[120px] bg-[#F7F5F2] border border-dashed border-[#D4CFC6] rounded-2xl p-6 hover:border-black/30 hover:bg-[#F0EDE8] transition-all flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4 text-black/30 group-hover:text-black/60 transition-colors" />
                            <span className="text-xs font-semibold text-black/35 group-hover:text-black/60 transition-colors">New Application</span>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    )
}
