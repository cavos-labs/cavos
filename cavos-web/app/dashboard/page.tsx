'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActivityChart } from '@/components/ActivityChart'

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
        <div className="space-y-6 animate-fadeIn">

            {/* ── Page header ── */}
            <PageHeader
                className="pb-5 border-b border-line"
                title="Overview"
                subtitle={<span className="font-mono text-[13px]">{user?.email}</span>}
                actions={
                    <Link href="/dashboard/apps/new">
                        <Button variant="primary" size="sm" icon={<Icon.Add size={15} weight="bold" />}>
                            New App
                        </Button>
                    </Link>
                }
            />

            {/* ── Getting started banner (empty state) ── */}
            {isEmpty && (
                <div className="relative overflow-hidden rounded-xl bg-ink text-white p-7 border border-black/10">
                    {/* Brand glow */}
                    <div
                        className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at top right, #402AFF26 0%, transparent 70%)' }}
                    />
                    <div className="relative space-y-4">
                        <div className="flex items-center gap-2">
                            <Icon.Bolt size={15} weight="fill" className="text-brand" />
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

            {/* ── Stats strip ── */}
            <div data-dash-stat className="grid grid-cols-1 sm:grid-cols-3 rounded-xl border border-line bg-white divide-y sm:divide-y-0 sm:divide-x divide-line overflow-hidden">
                {[
                    { icon: Icon.Org,      label: 'Organizations', value: organizations.length,  href: '/dashboard/organizations' },
                    { icon: Icon.Apps,     label: 'Applications',  value: apps.length,            href: '/dashboard/apps' },
                    { icon: Icon.Activity, label: 'Total Wallets', value: loadingStats ? null : totalWallets, href: null },
                ].map((stat, i) => {
                    const body = (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[13px] font-medium text-black/55">
                                    <stat.icon size={16} className="text-black/40" />
                                    {stat.label}
                                </span>
                                {stat.href && (
                                    <Icon.ChevronRight size={15} weight="bold" className="text-black/20 group-hover:text-black/45 group-hover:translate-x-0.5 transition-all" />
                                )}
                            </div>
                            <span className="font-mono text-[32px] leading-none font-semibold tracking-tight text-ink">
                                {stat.value === null ? '—' : stat.value}
                            </span>
                        </>
                    )
                    return stat.href ? (
                        <Link key={i} href={stat.href} className="group flex flex-col gap-4 p-5 hover:bg-surface transition-colors">
                            {body}
                        </Link>
                    ) : (
                        <div key={i} className="group flex flex-col gap-4 p-5">{body}</div>
                    )
                })}
            </div>

            {/* ── Activity chart ── */}
            <ActivityChart data={stats} loading={loadingStats} />

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Recent apps (or manage card if empty) */}
                <div data-dash-panel className="rounded-xl bg-white border border-line p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
                        <h3 className="text-[13px] font-bold text-ink flex items-center gap-2">
                            Applications
                            <span className="font-mono text-[11px] font-medium text-black/35">{apps.length}</span>
                        </h3>
                        <Link href="/dashboard/apps/new" className="inline-flex items-center gap-1 text-xs font-semibold text-black/45 hover:text-ink transition-colors">
                            <Icon.Add size={14} weight="bold" /> New
                        </Link>
                    </div>

                    {apps.length === 0 ? (
                        <div className="py-4 space-y-3">
                            <p className="text-sm text-black/40 leading-relaxed">No applications yet. Create one to get an App ID and start integrating.</p>
                            <Link href="/dashboard/apps/new" className="inline-flex items-center gap-1 text-xs font-semibold text-black/40 hover:text-black transition-colors">
                                Create first app <Icon.ArrowRight size={13} weight="bold" />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {apps.slice(0, 4).map((app: any) => (
                                <Link key={app.id} href={`/dashboard/apps/${app.id}`}>
                                    <div className="group flex items-center justify-between px-3 py-2.5 -mx-2 rounded-lg hover:bg-surface transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Icon.Apps size={16} className="text-black/40 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-medium text-ink truncate">{app.name}</p>
                                                {app.organization && (
                                                    <p className="text-[10px] text-black/35 truncate">{app.organization.name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Icon.ChevronRight size={14} weight="bold" className="text-black/20 group-hover:text-black/50 shrink-0 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                            {apps.length > 4 && (
                                <Link href="/dashboard/apps" className="flex items-center gap-1 px-3 pt-2 text-xs font-semibold text-black/30 hover:text-black transition-colors">
                                    +{apps.length - 4} more <Icon.ArrowRight size={13} weight="bold" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Right column: orgs + resources */}
                <div data-dash-panel className="space-y-4">
                    {/* Organizations card */}
                    <div className="rounded-xl bg-white border border-line p-5">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
                            <h3 className="text-[13px] font-bold text-ink flex items-center gap-2">
                                Organizations
                                <span className="font-mono text-[11px] font-medium text-black/35">{organizations.length}</span>
                            </h3>
                            <Link href="/dashboard/organizations/new" className="inline-flex items-center gap-1 text-xs font-semibold text-black/45 hover:text-ink transition-colors">
                                <Icon.Add size={14} weight="bold" /> New
                            </Link>
                        </div>
                        {organizations.length === 0 ? (
                            <Link href="/dashboard/organizations/new" className="inline-flex items-center gap-1 text-xs font-semibold text-black/40 hover:text-black transition-colors">
                                Create first organization <Icon.ArrowRight size={13} weight="bold" />
                            </Link>
                        ) : (
                            <div className="space-y-1">
                                {organizations.slice(0, 3).map((org: any) => (
                                    <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
                                        <div className="group flex items-center justify-between px-3 py-2.5 -mx-2 rounded-lg hover:bg-surface transition-colors">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Icon.Org size={16} className="text-black/40 shrink-0" />
                                                <p className="text-[13px] font-medium text-ink truncate">{org.name}</p>
                                            </div>
                                            <Icon.ChevronRight size={14} weight="bold" className="text-black/20 group-hover:text-black/50 shrink-0 transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Resources */}
                    <div className="rounded-xl bg-surface/60 border border-line p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Icon.Docs size={18} className="text-black/45 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-black/70">Documentation</p>
                                <p className="text-[10px] text-black/40">Guides, SDK reference, API docs.</p>
                            </div>
                        </div>
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-black/40 hover:text-black transition-colors"
                        >
                            Open <Icon.ArrowRight size={13} weight="bold" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
