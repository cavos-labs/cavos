'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { useOrganization } from '@/lib/hooks/useOrganization'

export default function AppsPage() {
    const router = useRouter()
    const [apps, setApps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { organizationId, loading: organizationLoading } = useOrganization()

    useEffect(() => { if (organizationId) fetchApps() }, [organizationId])

    const fetchApps = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/apps?organization_id=${organizationId}`)
            if (!res.ok) {
                if (res.status === 401) { router.push('/login'); return }
                throw new Error('Failed to fetch apps')
            }
            const data = await res.json()
            setApps(data.apps || [])
        } catch {
            setError('Failed to load applications')
        } finally {
            setLoading(false)
        }
    }

    if (loading || organizationLoading) {
        return <PageSkeleton />
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Product"
                title="Applications"
                subtitle="Manage the apps that embed Cavos wallets."
                actions={
                    <Link href={`/dashboard/apps/new?organization_id=${organizationId}`}>
                        <Button icon={<Icon.Add size={15} weight="bold" />}>
                            New application
                        </Button>
                    </Link>
                }
            />

            {error && (
                <div role="alert" className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}

            {apps.length === 0 ? (
                <EmptyState
                    title="No applications yet"
                    description="Create an app to get an environment ID and start integrating device-native wallets."
                    action={
                        <Link href={`/dashboard/apps/new?organization_id=${organizationId}`}>
                            <Button size="sm">Create application</Button>
                        </Link>
                    }
                />
            ) : (
                <div data-dash-panel className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apps.map((app) => (
                        <Link key={app.id} href={`/dashboard/apps/${app.id}`}>
                            <div className="group h-full rounded-xl border border-line bg-white p-5 transition-[border-color] duration-150 hover:border-line-strong">
                                <div className="flex items-start justify-between mb-4">
                                    {/* App logo or fallback */}
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-black/[0.04] border border-line shrink-0 group-hover:border-line-strong transition-colors">
                                        {app.logo_url ? (
                                            <Image
                                                src={app.logo_url}
                                                alt={app.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon.Apps size={16} className="text-black/30" />
                                            </div>
                                        )}
                                    </div>
                                    <Icon.ArrowRight size={16} weight="bold" className="text-black/20 group-hover:text-black/50 transition-all group-hover:translate-x-0.5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-sm truncate">{app.name}</h3>
                                    {app.organization && (
                                        <p className="text-[10px] font-semibold text-black/30 uppercase tracking-wide truncate">
                                            {app.organization.name}
                                        </p>
                                    )}
                                    {app.description && (
                                        <p className="text-xs text-black/45 line-clamp-2 pt-1 leading-relaxed">
                                            {app.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Add new card */}
                    <Link href={`/dashboard/apps/new?organization_id=${organizationId}`}>
                        <div className="group h-full min-h-[120px] bg-surface border border-dashed border-line-strong rounded-2xl p-6 hover:border-black/30 hover:bg-black/[0.03] transition-all flex items-center justify-center gap-2">
                            <Icon.Add size={16} weight="bold" className="text-black/35 group-hover:text-black/60 transition-colors" />
                            <span className="text-xs font-semibold text-muted group-hover:text-ink transition-colors">New application</span>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    )
}
