'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ActivityChart } from '@/components/ActivityChart'
import { Building2, AppWindow, Activity, Plus } from 'lucide-react'

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
                <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-semibold tracking-tight mb-2">
                    Overview
                </h1>
                <p className="text-black/60">
                    Welcome back, {user?.email}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-black/5 rounded-xl">
                            <Building2 className="w-6 h-6 text-black/80" />
                        </div>
                        <div>
                            <p className="text-sm text-black/60 mb-1">Organizations</p>
                            <p className="text-3xl font-semibold tracking-tight">{organizations.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-black/5 rounded-xl">
                            <AppWindow className="w-6 h-6 text-black/80" />
                        </div>
                        <div>
                            <p className="text-sm text-black/60 mb-1">Applications</p>
                            <p className="text-3xl font-semibold tracking-tight">{apps.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-black/5 rounded-xl">
                            <Activity className="w-6 h-6 text-black/80" />
                        </div>
                        <div>
                            <p className="text-sm text-black/60 mb-1">Total Wallets</p>
                            <p className="text-3xl font-semibold tracking-tight">
                                {stats.reduce((acc, curr) => acc + curr.wallets, 0)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Activity Chart */}
            <ActivityChart data={stats} loading={loadingStats} />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:border-black/20 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-black/5 rounded-lg">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <Link href="/dashboard/organizations/new">
                            <Button size="sm" variant="outline" icon={<Plus className="w-4 h-4" />}>
                                New Organization
                            </Button>
                        </Link>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Manage Organizations</h3>
                    <p className="text-sm text-black/60 mb-4">
                        Create and manage your organizations to group your applications and team members.
                    </p>
                    <Link href="/dashboard/organizations" className="text-sm font-medium hover:underline">
                        View all organizations →
                    </Link>
                </Card>

                <Card className="hover:border-black/20 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-black/5 rounded-lg">
                            <AppWindow className="w-5 h-5" />
                        </div>
                        <Link href="/dashboard/apps/new">
                            <Button size="sm" variant="outline" icon={<Plus className="w-4 h-4" />}>
                                New Application
                            </Button>
                        </Link>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Manage Applications</h3>
                    <p className="text-sm text-black/60 mb-4">
                        Build apps with embedded wallets. Get your App ID and start integrating.
                    </p>
                    <Link href="/dashboard/apps" className="text-sm font-medium hover:underline">
                        View all applications →
                    </Link>
                </Card>
            </div>
        </div>
    )
}
