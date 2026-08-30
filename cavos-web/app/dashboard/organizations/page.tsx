'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSkeleton } from '@/components/ui/Skeleton'

export default function OrganizationsPage() {
    const router = useRouter()
    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => { fetchOrganizations() }, [])

    const fetchOrganizations = async () => {
        try {
            const res = await fetch('/api/organizations')
            if (!res.ok) {
                if (res.status === 401) { router.push('/login'); return }
                throw new Error('Failed to fetch organizations')
            }
            const data = await res.json()
            setOrganizations(data.organizations || [])
        } catch {
            setError('Failed to load organizations')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <PageSkeleton />
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Workspace"
                title="Organizations"
                subtitle="Group apps, keys, and team access under one workspace."
                actions={
                    <Link href="/dashboard/organizations/new">
                        <Button icon={<Icon.Add size={15} weight="bold" />}>
                            New organization
                        </Button>
                    </Link>
                }
            />

            {error && (
                <div role="alert" className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}

            {organizations.length === 0 ? (
                <EmptyState
                    title="No organizations yet"
                    description="Create an organization to group your apps and manage API keys."
                    action={
                        <Link href="/dashboard/organizations/new">
                            <Button size="sm">Create organization</Button>
                        </Link>
                    }
                />
            ) : (
                <div data-dash-panel className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {organizations.map((org) => (
                        <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
                            <div className="group h-full rounded-xl border border-line bg-white p-5 transition-[border-color] duration-150 hover:border-line-strong">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2.5 bg-black/[0.04] rounded-xl text-ink/65 group-hover:bg-black/[0.07] transition-colors">
                                        <Icon.Org size={17} />
                                    </div>
                                    <Icon.ArrowRight size={16} weight="bold" className="text-black/20 group-hover:text-black/50 transition-all group-hover:translate-x-0.5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-sm truncate">{org.name}</h3>
                                    <p className="text-[10px] font-mono text-black/30 truncate">{org.slug}</p>
                                    {org.description && (
                                        <p className="text-xs text-black/45 line-clamp-2 pt-1 leading-relaxed">
                                            {org.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Add new card */}
                    <Link href="/dashboard/organizations/new">
                        <div className="group h-full min-h-[120px] bg-surface border border-dashed border-line-strong rounded-2xl p-6 hover:border-black/30 hover:bg-black/[0.03] transition-all flex items-center justify-center gap-2">
                            <Icon.Add size={16} weight="bold" className="text-black/35 group-hover:text-black/60 transition-colors" />
                            <span className="text-xs font-semibold text-muted group-hover:text-ink transition-colors">New organization</span>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    )
}
