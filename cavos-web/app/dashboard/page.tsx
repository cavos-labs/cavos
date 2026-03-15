'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { ActivityChart } from '@/components/ActivityChart'
import { Building2, AppWindow, Activity, Plus, ArrowRight, Zap, ChevronRight, FileText } from 'lucide-react'

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [organizations, setOrganizations] = useState<any[]>([])
    const [apps, setApps] = useState<any[]>([])
    const [stats, setStats] = useState<any[]>([])
    const [loadingStats, setLoadingStats] = useState(true)

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUser(user)
            await Promise.all([
                fetchOrganizations(),
                fetchApps(),
                fetchStats()
            ])
            setLoading(false)
        }

        checkUser()
    }, [router])

    const fetchOrganizations = async () => {
        try {
            const res = await fetch('/api/organizations')
            if (res.ok) {
                const data = await res.json()
                setOrganizations(data.organizations || [])
            }
        } catch (err) {
            console.error('Failed to fetch organizations:', err)
        }
    }

    const fetchApps = async () => {
        try {
            const res = await fetch('/api/apps')
            if (res.ok) {
                const data = await res.json()
                setApps(data.apps || [])
            }
        } catch (err) {
            console.error('Failed to fetch apps:', err)
        }
    }

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/analytics/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data.stats || [])
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        } finally {
            setLoadingStats(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-7 h-7 border-2 border-black/15 border-t-black/60 rounded-full animate-spin" />
            </div>
        )
    }

    const totalWallets = stats.reduce((acc, curr) => acc + curr.wallets, 0)
    const isEmpty = organizations.length === 0 && apps.length === 0

    return (
        <div className="space-y-7 animate-fadeIn">

            {/* ── Page header ── */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/30 mb-1.5">
                        {getGreeting()}
                    </p>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Overview</h1>
                    <p className="text-xs text-black/35 mt-1 font-medium">{user?.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 mt-1">
                    <Link href="/dashboard/apps/new">
                        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                            New App
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ── Getting started banner (empty state) ── */}
            {isEmpty && (
                <div className="relative overflow-hidden rounded-2xl bg-[#0A0908] text-white p-7 border border-black/10">
                    {/* Warm glow */}
                    <div
                        className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at top right, #EAE5DC0D 0%, transparent 70%)' }}
                    />
                    <div className="relative space-y-4">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-[#EAE5DC]/50" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Get Started</span>
                        </div>
                        <h3 className="text-xl font-bold">Ready to build?</h3>
                        <p className="text-sm text-white/45 max-w-md leading-relaxed">
                            Create an organization to group your apps and team members, then add your first application to get an App ID.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                            <Link href="/dashboard/organizations/new">
                                <Button size="sm" className="bg-white/10 text-white hover:bg-white/16 border border-white/10 rounded-xl">
                                    Create Organization
                                </Button>
                            </Link>
                            <a href="https://docs.cavos.xyz" target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl">
                                    Read the docs →
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: Building2, label: 'Organizations', value: organizations.length,  href: '/dashboard/organizations' },
                    { icon: AppWindow, label: 'Applications',  value: apps.length,            href: '/dashboard/apps' },
                    { icon: Activity,  label: 'Total Wallets', value: loadingStats ? null : totalWallets, href: null },
                ].map((stat, i) => (
                    <div
                        key={i}
                        onClick={() => stat.href && router.push(stat.href)}
                        className={`group relative overflow-hidden rounded-2xl bg-white border border-black/[0.08] p-6 transition-all
                            ${stat.href ? 'cursor-pointer hover:border-black/[0.15] hover:shadow-md hover:shadow-black/[0.05]' : ''}
                        `}
                    >
                        {/* Beige orb accent */}
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#EAE5DC]/25 -translate-y-6 translate-x-6 group-hover:bg-[#EAE5DC]/40 transition-colors" />

                        <div className="relative flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-[#F2EEE8] rounded-xl group-hover:bg-[#EAE5DC] transition-colors">
                                <stat.icon className="w-4 h-4 text-black/50" />
                            </div>
                            {stat.href && (
                                <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-black/40 transition-colors mt-0.5" />
                            )}
                        </div>

                        <div className="relative">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 mb-1.5">{stat.label}</p>
                            <p className="text-4xl font-bold tracking-tight tabular-nums">
                                {stat.value === null ? '—' : stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Activity chart ── */}
            <ActivityChart data={stats} loading={loadingStats} />

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Recent apps (or manage card if empty) */}
                <div className="rounded-2xl bg-white border border-black/[0.08] p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-[#F2EEE8] rounded-lg">
                                <AppWindow className="w-3.5 h-3.5 text-black/50" />
                            </div>
                            <h3 className="text-sm font-bold">Applications</h3>
                        </div>
                        <Link href="/dashboard/apps/new">
                            <Button size="sm" variant="outline" icon={<Plus className="w-3.5 h-3.5" />}>
                                New
                            </Button>
                        </Link>
                    </div>

                    {apps.length === 0 ? (
                        <div className="py-4 space-y-3">
                            <p className="text-sm text-black/40 leading-relaxed">No applications yet. Create one to get an App ID and start integrating.</p>
                            <Link href="/dashboard/apps/new" className="inline-flex items-center gap-1 text-xs font-semibold text-black/40 hover:text-black transition-colors">
                                Create first app <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {apps.slice(0, 4).map((app: any) => (
                                <Link key={app.id} href={`/dashboard/apps/${app.id}`}>
                                    <div className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F7F5F2] transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-6 h-6 rounded-lg bg-[#F2EEE8] border border-[#EAE5DC] flex items-center justify-center shrink-0">
                                                <AppWindow className="w-3 h-3 text-black/30" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold truncate">{app.name}</p>
                                                {app.organization && (
                                                    <p className="text-[10px] text-black/30 truncate">{app.organization.name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-black/20 group-hover:text-black/50 shrink-0 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                            {apps.length > 4 && (
                                <Link href="/dashboard/apps" className="flex items-center gap-1 px-3 pt-2 text-xs font-semibold text-black/30 hover:text-black transition-colors">
                                    +{apps.length - 4} more <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Right column: orgs + resources */}
                <div className="space-y-4">
                    {/* Organizations card */}
                    <div className="rounded-2xl bg-white border border-black/[0.08] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-[#F2EEE8] rounded-lg">
                                    <Building2 className="w-3.5 h-3.5 text-black/50" />
                                </div>
                                <h3 className="text-sm font-bold">Organizations</h3>
                            </div>
                            <Link href="/dashboard/organizations/new">
                                <Button size="sm" variant="outline" icon={<Plus className="w-3.5 h-3.5" />}>
                                    New
                                </Button>
                            </Link>
                        </div>
                        {organizations.length === 0 ? (
                            <Link href="/dashboard/organizations/new" className="inline-flex items-center gap-1 text-xs font-semibold text-black/40 hover:text-black transition-colors">
                                Create first organization <ArrowRight className="w-3 h-3" />
                            </Link>
                        ) : (
                            <div className="space-y-1">
                                {organizations.slice(0, 3).map((org: any) => (
                                    <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
                                        <div className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F7F5F2] transition-colors">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-6 h-6 rounded-lg bg-[#F2EEE8] border border-[#EAE5DC] flex items-center justify-center shrink-0">
                                                    <Building2 className="w-3 h-3 text-black/30" />
                                                </div>
                                                <p className="text-xs font-semibold truncate">{org.name}</p>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-black/20 group-hover:text-black/50 shrink-0 transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Resources */}
                    <div className="rounded-2xl bg-[#F7F5F2] border border-[#EAE5DC] p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white border border-[#EAE5DC] rounded-lg">
                                <FileText className="w-3.5 h-3.5 text-black/40" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-black/70">Documentation</p>
                                <p className="text-[10px] text-black/35">Guides, SDK reference, API docs.</p>
                            </div>
                        </div>
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-black/40 hover:text-black transition-colors"
                        >
                            Open <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
