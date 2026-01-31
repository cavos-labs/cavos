'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Building2, Loader2 } from 'lucide-react'

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-black/20" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">
                        Organizations
                    </h1>
                    <p className="text-black/60">
                        Manage your organizations and their applications
                    </p>
                </div>
                <Link href="/dashboard/organizations/new">
                    <Button icon={<Plus className="w-4 h-4" />}>
                        Create Organization
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            {organizations.length === 0 ? (
                <Card className="py-12 text-center">
                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-black/40" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
                    <p className="text-black/60 mb-6">
                        Create your first organization to get started
                    </p>
                    <Link href="/dashboard/organizations/new">
                        <Button variant="outline">Create Organization</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizations.map((org) => (
                        <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
                            <Card className="h-full hover:border-black/30 transition-colors cursor-pointer group">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-black/5 rounded-xl group-hover:bg-black/10 transition-colors">
                                        <Building2 className="w-6 h-6 text-black/80" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate mb-1">{org.name}</h3>
                                        <p className="text-sm text-black/50 font-mono mb-2">{org.slug}</p>
                                        {org.description && (
                                            <p className="text-sm text-black/60 line-clamp-2">
                                                {org.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
