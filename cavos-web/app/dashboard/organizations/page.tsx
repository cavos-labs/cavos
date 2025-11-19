'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

export default function OrganizationsPage() {
    const router = useRouter()
    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            const res = await fetch('/api/organizations')

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/login')
                    return
                }
                throw new Error('Failed to fetch organizations')
            }

            const data = await res.json()
            setOrganizations(data.organizations || [])
        } catch (err) {
            setError('Failed to load organizations')
        } finally {
            setLoading(false)
        }
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
                            className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                        >
                            Overview
                        </Link>
                        <Link
                            href="/dashboard/organizations"
                            className="block px-4 py-2.5 text-sm font-medium bg-black/5 text-black rounded-lg"
                        >
                            Organizations
                        </Link>
                        <Link
                            href="/dashboard/apps"
                            className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                        >
                            Applications
                        </Link>
                    </nav>
                </aside>

                {/* Main Content - Responsive margin */}
                <div className="md:ml-64 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-2">
                                    Organizations
                                </h1>
                                <p className="text-black/60 text-sm md:text-base">
                                    Manage your organizations and their applications
                                </p>
                            </div>
                            <Link
                                href="/dashboard/organizations/new"
                                className="px-5 md:px-6 py-2 md:py-2.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm text-center"
                            >
                                Create Organization
                            </Link>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Loading */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                            </div>
                        ) : organizations.length === 0 ? (
                            /* Empty State */
                            <div className="bg-white border border-black/10 rounded-2xl p-8 md:p-12 text-center">
                                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <path d="M9 3v18" />
                                    </svg>
                                </div>
                                <h3 className="text-lg md:text-xl font-semibold mb-2">
                                    No organizations yet
                                </h3>
                                <p className="text-black/60 mb-6 text-sm md:text-base">
                                    Create your first organization to get started
                                </p>
                                <Link
                                    href="/dashboard/organizations/new"
                                    className="inline-block px-5 md:px-6 py-2 md:py-2.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm"
                                >
                                    Create Organization
                                </Link>
                            </div>
                        ) : (
                            /* Organizations Grid - Responsive */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {organizations.map((org) => (
                                    <Link
                                        key={org.id}
                                        href={`/dashboard/organizations/${org.id}`}
                                        className="bg-white border border-black/10 rounded-2xl p-5 md:p-6 hover:border-black/20 transition-colors group"
                                    >
                                        <div className="flex items-start gap-3 md:gap-4">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-black/5 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-black/10 transition-colors">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-6 md:h-6">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <path d="M9 3v18" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base md:text-lg font-semibold mb-1 truncate">
                                                    {org.name}
                                                </h3>
                                                <p className="text-xs md:text-sm text-black/50 mb-2">
                                                    {org.slug}
                                                </p>
                                                {org.description && (
                                                    <p className="text-xs md:text-sm text-black/70 line-clamp-2">
                                                        {org.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
