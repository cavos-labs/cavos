'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft } from 'lucide-react'

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
            <div className="max-w-2xl mx-auto pt-8 animate-fadeIn">
                <Card className="text-center py-12">
                    <h3 className="text-xl font-semibold mb-2">
                        No organizations found
                    </h3>
                    <p className="text-black/60 mb-6">
                        You need to create an organization first before creating an app
                    </p>
                    <Link href="/dashboard/organizations/new">
                        <Button>Create Organization</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
            {/* Back Link */}
            <Link
                href="/dashboard/apps"
                className="inline-flex items-center text-sm text-black/60 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Applications
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-semibold tracking-tight mb-2">
                    Create Application
                </h1>
                <p className="text-black/60">
                    Create a new app to integrate Cavos embedded wallets. Each app gets a unique ID.
                </p>
            </div>

            {/* Form */}
            <Card>
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="organization" className="block text-sm font-medium text-black/80 mb-2">
                            Organization *
                        </label>
                        <div className="relative">
                            <select
                                id="organization"
                                value={organizationId}
                                onChange={(e) => setOrganizationId(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-lg text-sm text-black focus:outline-none focus:border-black/30 transition-colors disabled:opacity-50 appearance-none"
                            >
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-black/80 mb-2">
                            Application Name *
                        </label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My App"
                            required
                            disabled={loading}
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
                            className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-black/30 transition-colors disabled:opacity-50 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            loading={loading}
                            className="flex-1"
                        >
                            Create Application
                        </Button>
                        <Link href="/dashboard/apps" className="flex-1">
                            <Button variant="outline" className="w-full">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    )
}
