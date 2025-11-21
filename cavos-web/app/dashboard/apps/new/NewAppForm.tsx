'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AppForm } from '@/components/AppForm'
import { ArrowLeft, Loader2 } from 'lucide-react'

export function NewAppForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preselectedOrgId = searchParams.get('organization')

    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            const res = await fetch('/api/organizations')
            if (!res.ok) throw new Error('Failed to fetch organizations')
            const data = await res.json()
            setOrganizations(data.organizations || [])
        } catch (err) {
            setError('Failed to load organizations')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-black/20" />
            </div>
        )
    }

    if (organizations.length === 0) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <Card className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
                    <p className="text-black/60 mb-6">
                        You need to create an organization before you can create an application.
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
            <Link
                href="/dashboard/apps"
                className="inline-flex items-center text-sm text-black/60 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Applications
            </Link>

            <div>
                <h1 className="text-3xl font-semibold tracking-tight mb-2">
                    New Application
                </h1>
                <p className="text-black/60">
                    Create a new application to start integrating wallets.
                </p>
            </div>

            <Card>
                <AppForm
                    mode="create"
                    organizations={organizations}
                    initialData={{
                        name: '',
                        description: '',
                        organization_id: preselectedOrgId || organizations[0]?.id || ''
                    }}
                />
            </Card>
        </div>
    )
}
