'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [organizations, setOrganizations] = useState<any[]>([])
    const [apps, setApps] = useState<any[]>([])

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUser(user)
            await fetchOrganizations()
            await fetchApps()
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

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-black/60">Loading...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#FFFFFF]">
            <Header />

            <div className="pt-20">
                {/* Sidebar - Hidden on mobile */}
                <aside className="hidden md:block fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white border-r border-black/10 p-6">
                    <nav className="space-y-2">
                        <Link
                            href="/dashboard"
                            className="block px-4 py-2.5 text-sm font-medium bg-black/5 text-black rounded-lg"
                        >
                            Overview
                        </Link>
                        <Link
                            href="/dashboard/organizations"
                            className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                        >
                            Organizations
                        </Link>
                        <Link
                            href="/dashboard/apps"
                            className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                        >
                            Applications
                        </Link>

                        <div className="pt-4 mt-4 border-t border-black/10">
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors text-left"
                            >
                                Sign Out
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Main Content - Responsive margin */}
                <div className="md:ml-64 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="mb-6 md:mb-8">
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-2">
                                Dashboard
                            </h1>
                            <p className="text-black/60 text-sm md:text-base">
                                {user?.email}
                            </p>
                        </div>

                        {/* Stats Grid - Responsive columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                            <div className="bg-white border border-black/10 rounded-2xl p-4 md:p-6">
                                <p className="text-sm text-black/60 mb-1">Organizations</p>
                                <p className="text-2xl md:text-3xl font-semibold">{organizations.length}</p>
                            </div>
                            <div className="bg-white border border-black/10 rounded-2xl p-4 md:p-6">
                                <p className="text-sm text-black/60 mb-1">Applications</p>
                                <p className="text-2xl md:text-3xl font-semibold">{apps.length}</p>
                            </div>
                            <div className="bg-white border border-black/10 rounded-2xl p-4 md:p-6 sm:col-span-2 md:col-span-1">
                                <p className="text-sm text-black/60 mb-1">API Calls</p>
                                <p className="text-2xl md:text-3xl font-semibold">0</p>
                            </div>
                        </div>

                        {/* Quick Actions - Responsive grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8">
                                <h3 className="text-lg md:text-xl font-semibold mb-2">Organizations</h3>
                                <p className="text-black/60 mb-4 md:mb-6 text-sm md:text-base">
                                    Create and manage your organizations
                                </p>
                                <Link
                                    href="/dashboard/organizations/new"
                                    className="inline-block px-5 md:px-6 py-2 md:py-2.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm"
                                >
                                    Create Organization
                                </Link>
                            </div>

                            <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8">
                                <h3 className="text-lg md:text-xl font-semibold mb-2">Applications</h3>
                                <p className="text-black/60 mb-4 md:mb-6 text-sm md:text-base">
                                    Build apps with embedded wallets
                                </p>
                                <Link
                                    href="/dashboard/apps/new"
                                    className="inline-block px-5 md:px-6 py-2 md:py-2.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm"
                                >
                                    Create Application
                                </Link>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        {(organizations.length > 0 || apps.length > 0) && (
                            <div className="mt-6 md:mt-8">
                                <h2 className="text-lg md:text-xl font-semibold mb-4">Recent Activity</h2>
                                <div className="bg-white border border-black/10 rounded-2xl divide-y divide-black/10">
                                    {organizations.slice(0, 3).map((org: any) => (
                                        <Link
                                            key={org.id}
                                            href={`/dashboard/organizations/${org.id}`}
                                            className="block p-4 hover:bg-black/5 transition-colors"
                                        >
                                            <p className="font-medium text-sm md:text-base">{org.name}</p>
                                            <p className="text-xs md:text-sm text-black/60">Organization</p>
                                        </Link>
                                    ))}
                                    {apps.slice(0, 3).map((app: any) => (
                                        <Link
                                            key={app.id}
                                            href={`/dashboard/apps/${app.id}`}
                                            className="block p-4 hover:bg-black/5 transition-colors"
                                        >
                                            <p className="font-medium text-sm md:text-base">{app.name}</p>
                                            <p className="text-xs md:text-sm text-black/60">Application</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
