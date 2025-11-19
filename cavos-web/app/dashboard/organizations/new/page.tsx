'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

export default function NewOrganizationPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to create organization')
                setLoading(false)
                return
            }

            router.push('/dashboard/organizations')
            router.refresh()
        } catch (err) {
            setError('An unexpected error occurred')
            setLoading(false)
        }
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

                {/* Main Content */}
                <div className="ml-64 p-8">
                    <div className="max-w-2xl mx-auto">
                        {/* Back Link */}
                        <Link
                            href="/dashboard/organizations"
                            className="inline-flex items-center text-sm text-black/60 hover:text-black mb-6"
                        >
                            ← Back to Organizations
                        </Link>

                        {/* Title */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-2">
                                Create Organization
                            </h1>
                            <p className="text-black/60">
                                Organizations help you manage multiple applications
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
                                    <label htmlFor="name" className="block text-sm font-medium text-black/80 mb-2">
                                        Organization Name *
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Acme Inc"
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
                                        placeholder="A brief description of your organization"
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
                                        {loading ? 'Creating...' : 'Create Organization'}
                                    </button>
                                    <Link
                                        href="/dashboard/organizations"
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
