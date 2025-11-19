'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

export default function AppDetailPage() {
    const router = useRouter()
    const params = useParams()
    const appId = params.id as string

    const [app, setApp] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (appId) {
            fetchApp()
        }
    }, [appId])

    const fetchApp = async () => {
        try {
            const res = await fetch(`/api/apps/${appId}`)

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/login')
                    return
                }
                throw new Error('Failed to fetch app')
            }

            const data = await res.json()
            setApp(data.app)
        } catch (err) {
            setError('Failed to load application')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/apps/${appId}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                throw new Error('Failed to delete app')
            }

            router.push('/dashboard/apps')
            router.refresh()
        } catch (err) {
            setError('Failed to delete application')
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
                            <Link href="/dashboard/organizations" className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                                Organizations
                            </Link>
                            <Link href="/dashboard/apps" className="block px-4 py-2.5 text-sm font-medium bg-black/5 text-black rounded-lg">
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

    if (error || !app) {
        return (
            <main className="min-h-screen bg-[#FFFFFF]">
                <Header />
                <div className="pt-20">
                    <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white border-r border-black/10 p-6">
                        <nav className="space-y-2">
                            <Link href="/dashboard" className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                                Overview
                            </Link>
                            <Link href="/dashboard/organizations" className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                                Organizations
                            </Link>
                            <Link href="/dashboard/apps" className="block px-4 py-2.5 text-sm font-medium bg-black/5 text-black rounded-lg">
                                Applications
                            </Link>
                        </nav>
                    </aside>
                    <div className="md:ml-64 p-4 md:p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                                <p className="text-red-600 mb-4">{error || 'Application not found'}</p>
                                <Link href="/dashboard/apps" className="inline-block px-6 py-2.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm">
                                    Back to Applications
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
                            className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                        >
                            Organizations
                        </Link>
                        <Link
                            href="/dashboard/apps"
                            className="block px-4 py-2.5 text-sm font-medium bg-black/5 text-black rounded-lg"
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
                            href="/dashboard/apps"
                            className="inline-flex items-center text-sm text-black/60 hover:text-black mb-4 md:mb-6"
                        >
                            ← Back to Applications
                        </Link>

                        {/* App Header */}
                        <div className="bg-white border border-black/10 rounded-2xl p-5 md:p-8 mb-4 md:mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                <div className="flex items-start gap-3 md:gap-4">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-black/5 rounded-xl flex items-center justify-center shrink-0">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-8 md:h-8">
                                            <rect x="2" y="7" width="20" height="14" rx="2" />
                                            <path d="M16 3h2a2 2 0 0 1 2 2v2" />
                                            <path d="M8 3H6a2 2 0 0 0-2 2v2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-2">
                                            {app.name}
                                        </h1>
                                        {app.organization && (
                                            <Link
                                                href={`/dashboard/organizations/${app.organization.id}`}
                                                className="text-black/60 text-xs md:text-sm hover:text-black transition-colors inline-flex items-center gap-1 mb-2"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <path d="M9 3v18" />
                                                </svg>
                                                {app.organization.name}
                                            </Link>
                                        )}
                                        {app.description && (
                                            <p className="text-black/70 mt-2 text-sm md:text-base">
                                                {app.description}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-black/10">
                                <div>
                                    <p className="text-xs md:text-sm text-black/60 mb-1">Created</p>
                                    <p className="text-base md:text-lg font-medium">
                                        {new Date(app.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-black/60 mb-1">App ID</p>
                                    <p className="text-xs md:text-sm font-mono text-black/70 truncate">
                                        {app.id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Section */}
                        <div className="bg-white border border-black/10 rounded-2xl p-5 md:p-8 mb-4 md:mb-6">
                            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
                                Integration
                            </h2>
                            <p className="text-black/60 mb-6 text-sm md:text-base">
                                Use this App ID to integrate Cavos wallets into your application. Each user's wallet will be identified by this ID.
                            </p>

                            <div>
                                <label className="block text-xs md:text-sm font-medium text-black/80 mb-2">
                                    Application ID
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 px-4 py-3 bg-black/5 border border-black/10 rounded-lg">
                                        <p className="text-black/70 font-mono text-sm truncate">
                                            {app.id}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(app.id)
                                        }}
                                        className="px-3 md:px-4 py-3 border border-black/20 rounded-lg hover:bg-black/5 transition-colors shrink-0"
                                        title="Copy to clipboard"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-xs text-black/50 mt-2">
                                    This ID is used to identify which app the wallet belongs to when users sign in with Google
                                </p>
                            </div>
                        </div>

                        {/* How it Works */}
                        <div className="bg-white border border-black/10 rounded-2xl p-5 md:p-8">
                            <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-4">
                                How it Works
                            </h2>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shrink-0 text-sm font-semibold">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">User logs in with Google</h3>
                                        <p className="text-sm text-black/70">
                                            Cavos handles OAuth authentication through Google
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shrink-0 text-sm font-semibold">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Access token generated</h3>
                                        <p className="text-sm text-black/70">
                                            User receives an access token after successful authentication
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shrink-0 text-sm font-semibold">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Private key saved with App ID</h3>
                                        <p className="text-sm text-black/70">
                                            The encrypted private key is stored in the user's cloud storage, tagged with this App ID
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shrink-0 text-sm font-semibold">
                                        4
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Wallet recovery on re-login</h3>
                                        <p className="text-sm text-black/70">
                                            When the user logs in again, Cavos retrieves the correct wallet using the App ID
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                            <h3 className="text-2xl font-semibold mb-4">Delete Application</h3>
                            <p className="text-black/70 mb-6">
                                Are you sure you want to delete <strong>{app.name}</strong>? This action cannot be undone.
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
