'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

export default function NewAppForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preselectedOrgId = searchParams.get('org')

    const [organizations, setOrganizations] = useState<any[]>([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [organizationId, setOrganizationId] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            const res = await fetch('/api/organizations')
            if (res.ok) {
                const data = await res.json()
                setOrganizations(data.organizations || [])

                // Pre-select organization from URL or use first one
                if (preselectedOrgId && data.organizations?.some((org: any) => org.id === preselectedOrgId)) {
                    setOrganizationId(preselectedOrgId)
                } else if (data.organizations?.length > 0) {
                    setOrganizationId(data.organizations[0].id)
                }
            }
        } catch (err) {
            console.error('Failed to fetch organizations:', err)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!organizationId) {
            setError('Please select an organization')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    organization_id: organizationId
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to create application')
                setLoading(false)
                return
            }

            router.push('/dashboard/apps')
            router.refresh()
        } catch (err) {
            setError('An unexpected error occurred')
            setLoading(false)
        }
    }

    if (organizations.length === 0) {
        return (
            <main className="min-h-screen bg-[#FFFFFF]">
                <Header />

                <div className="pt-20">
                    <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white border-r border-black/10 p-6">
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

                    <div className="ml-64 p-8">
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white border border-black/10 rounded-2xl p-12 text-center">
                                <h3 className="text-xl font-semibold mb-2">
                                    No organizations found
                                </h3>
                                <p className="text-black/60 mb-6">
                                    You need to create an organization first before creating an app
                                </p>
                                <Link
                                    href="/dashboard/organizations/new"
                                    className="inline-block px-6 py-2.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm"
                                >
                                    Create Organization
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
                {/* Sidebar */}
                <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white border-r border-black/10 p-6">
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

                {/* Main Content */}
                <div className="ml-64 p-8">
                    <div className="max-w-2xl mx-auto">
                        {/* Back Link */}
                        <Link
                            href="/dashboard/apps"
                            className="inline-flex items-center text-sm text-black/60 hover:text-black mb-6"
                        >
                            ← Back to Applications
                        </Link>

                        {/* Title */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-2">
                                Create Application
                            </h1>
                            <p className="text-black/60">
                                Create a new app to integrate Cavos embedded wallets. Each app gets a unique ID for wallet identification.
                            </p>
                        </div>

                        {/* Form */}
                        <div className="bg-white border border-black/10 rounded-2xl p-8">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="organization" className="block text-sm font-medium text-black/80 mb-2">
                                        Organization *
                                    </label>
                                    <select
                                        id="organization"
                                        value={organizationId}
                                        onChange={(e) => setOrganizationId(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-white border border-black/20 rounded-lg text-black focus:outline-none focus:border-black/50 transition-colors disabled:opacity-50"
                                    >
                                        {organizations.map((org) => (
                                            <option key={org.id} value={org.id}>
                                                {org.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-black/80 mb-2">
                                        Application Name *
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="My App"
                                        required
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-white border border-black/20 rounded-lg text-black placeholder:text-black/40 focus:outline-none focus:border-black/50 transition-colors disabled:opacity-50"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-black/80 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="A brief description of your application"
                                        disabled={loading}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white border border-black/20 rounded-lg text-black placeholder:text-black/40 focus:outline-none focus:border-black/50 transition-colors disabled:opacity-50 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-8 py-3.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Creating...' : 'Create Application'}
                                    </button>
                                    <Link
                                        href="/dashboard/apps"
                                        className="flex-1 px-8 py-3.5 border border-black/20 text-black rounded-full font-medium hover:border-black/40 transition-all text-center"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
