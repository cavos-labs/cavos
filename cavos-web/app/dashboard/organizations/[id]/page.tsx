'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

export default function OrganizationDetailPage() {
    const router = useRouter()
    const params = useParams()
    const organizationId = params.id as string

    const [organization, setOrganization] = useState<any>(null)
    const [apps, setApps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (organizationId) {
            fetchOrganization()
            fetchApps()
        }
    }, [organizationId])

    const fetchOrganization = async () => {
        try {
            const res = await fetch(`/api/organizations/${organizationId}`)

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/login')
                    return
                }
                throw new Error('Failed to fetch organization')
            }

            const data = await res.json()
            setOrganization(data.organization)
        } catch (err) {
            setError('Failed to load organization')
        } finally {
            setLoading(false)
        }
    }

    const fetchApps = async () => {
        try {
            const res = await fetch(`/api/apps?organization_id=${organizationId}`)

            if (res.ok) {
                const data = await res.json()
                setApps(data.apps || [])
            }
        } catch (err) {
            console.error('Failed to fetch apps:', err)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/organizations/${organizationId}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                throw new Error('Failed to delete organization')
            }

            router.push('/dashboard/organizations')
            router.refresh()
        } catch (err) {
            setError('Failed to delete organization')
            setDeleting(false)
            setShowDeleteModal(false)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FFFFFF]">
                <Header />
                <div className="pt-20">
                    <aside className="hidden md:block fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white border-r border-black/10 p-6">
                        <nav className="space-y-2">
                            <Link href="/dashboard" className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                                Overview
                            </Link>
                            <Link href="/dashboard/organizations" className="block px-4 py-2.5 text-sm font-medium bg-black/5 text-black rounded-lg">
                                Organizations
                            </Link>
                            <Link href="/dashboard/apps" className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                                Applications
                            </Link>
                        </nav>
                    </aside>
                    <div className="md:ml-64 p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-5rem)]">
                        <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                    </div>
                </div>
            </main>
        )
    }

    if (error || !organization) {
        return (
            <main className="min-h-screen bg-[#FFFFFF]">
                <Header />
                <div className="pt-20">
                    <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white border-r border-black/10 p-6">
                        <nav className="space-y-2">
                            <Link href="/dashboard" className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                                Overview
                            </Link>
                            <Link href="/dashboard/organizations" className="block px-4 py-2.5 text-sm font-medium bg-black/5 text-black rounded-lg">
                                Organizations
                            </Link>
                            <Link href="/dashboard/apps" className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                                Applications
                            </Link>
                        </nav>
                    </aside>
                    <div className="md:ml-64 p-4 md:p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                                <p className="text-red-600 mb-4">{error || 'Organization not found'}</p>
                                <Link href="/dashboard/organizations" className="inline-block px-6 py-2.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm">
                                    Back to Organizations
                                </Link>
                            </div>
                        </div>
                    </div>
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
                        {/* Back Link */}
                        <Link
                            href="/dashboard/organizations"
                            className="inline-flex items-center text-sm text-black/60 hover:text-black mb-4 md:mb-6"
                        >
                            ← Back to Organizations
                        </Link>

                        {/* Organization Header */}
                        <div className="bg-white border border-black/10 rounded-2xl p-5 md:p-8 mb-4 md:mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                <div className="flex items-start gap-3 md:gap-4">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-black/5 rounded-xl flex items-center justify-center shrink-0">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-8 md:h-8">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <path d="M9 3v18" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-2">
                                            {organization.name}
                                        </h1>
                                        <p className="text-black/50 text-xs md:text-sm mb-2">
                                            {organization.slug}
                                        </p>
                                        {organization.description && (
                                            <p className="text-black/70 text-sm md:text-base">
                                                {organization.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                                >
                                    Delete
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-black/10">
                                <div>
                                    <p className="text-xs md:text-sm text-black/60 mb-1">Applications</p>
                                    <p className="text-xl md:text-2xl font-semibold">{apps.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-black/60 mb-1">Created</p>
                                    <p className="text-base md:text-lg font-medium">
                                        {new Date(organization.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-black/60 mb-1">ID</p>
                                    <p className="text-xs md:text-sm font-mono text-black/70 truncate">
                                        {organization.id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Applications Section */}
                        <div className="mb-4 md:mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4">
                                <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em]">
                                    Applications
                                </h2>
                                <Link
                                    href={`/dashboard/apps/new?org=${organizationId}`}
                                    className="px-4 py-2 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm text-center"
                                >
                                    Create App
                                </Link>
                            </div>

                            {apps.length === 0 ? (
                                <div className="bg-white border border-black/10 rounded-2xl p-8 md:p-12 text-center">
                                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="7" width="20" height="14" rx="2" />
                                            <path d="M16 3h2a2 2 0 0 1 2 2v2" />
                                            <path d="M8 3H6a2 2 0 0 0-2 2v2" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-semibold mb-2">
                                        No applications yet
                                    </h3>
                                    <p className="text-black/60 mb-6 text-sm md:text-base">
                                        Create your first application for this organization
                                    </p>
                                    <Link
                                        href={`/dashboard/apps/new?org=${organizationId}`}
                                        className="inline-block px-6 py-2.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm"
                                    >
                                        Create Application
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {apps.map((app) => (
                                        <Link
                                            key={app.id}
                                            href={`/dashboard/apps/${app.id}`}
                                            className="bg-white border border-black/10 rounded-xl p-5 md:p-6 hover:border-black/20 transition-colors group"
                                        >
                                            <div className="flex items-start gap-3 md:gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/5 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-black/10 transition-colors">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-6 md:h-6">
                                                        <rect x="2" y="7" width="20" height="14" rx="2" />
                                                        <path d="M16 3h2a2 2 0 0 1 2 2v2" />
                                                        <path d="M8 3H6a2 2 0 0 0-2 2v2" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base md:text-lg font-semibold mb-1 truncate">
                                                        {app.name}
                                                    </h3>
                                                    {app.description && (
                                                        <p className="text-xs md:text-sm text-black/70 line-clamp-2">
                                                            {app.description}
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
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => !deleting && setShowDeleteModal(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                            <h3 className="text-2xl font-semibold mb-4">Delete Organization</h3>
                            <p className="text-black/70 mb-6">
                                Are you sure you want to delete <strong>{organization.name}</strong>? This action cannot be undone and will also delete all associated applications.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                    className="flex-1 px-6 py-3 border border-black/20 text-black rounded-full font-medium hover:border-black/40 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </main>
    )
}
