'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
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
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Icon.Spinner size={26} weight="bold" className="animate-spin text-black/25" />
            </div>
        )
    }

    return (
        <div className="space-y-7 animate-fadeIn">

            {/* Header */}
            <PageHeader
                eyebrow="Dashboard"
                title="Applications"
                subtitle="Manage your apps with embedded wallets."
                actions={
                    <Link href={`/dashboard/apps/new?organization_id=${organizationId}`}>
                        <Button icon={<Icon.Add size={15} weight="bold" />}>
                            New Application
                        </Button>
                    </Link>
                }
            />

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Empty state */}
            {apps.length === 0 ? (
                <div data-dash-panel className="relative overflow-hidden rounded-2xl bg-ink text-white p-8 border border-black/10">
                    <div
                        className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at top right, #402AFF1F 0%, transparent 65%)' }}
                    />
                    <div className="relative space-y-4 max-w-md">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center">
                            <Icon.Apps size={20} className="text-white/55" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">No applications yet</h3>
                            <p className="text-sm text-white/40 leading-relaxed">
                                Create your first app to get an App ID and start integrating embedded wallets.
                            </p>
                        </div>
                        <Link href={`/dashboard/apps/new?organization_id=${organizationId}`}>
                            <Button size="sm" className="bg-white/10 text-white hover:bg-white/16 border border-white/10 rounded-xl mt-1">
                                Create Application
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div data-dash-panel className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apps.map((app) => (
                        <Link key={app.id} href={`/dashboard/apps/${app.id}`}>
                            <div className="group h-full bg-white border border-black/[0.08] rounded-2xl p-6 hover:border-black/[0.18] hover:shadow-md hover:shadow-black/[0.05] transition-all">
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
                            <span className="text-xs font-semibold text-black/40 group-hover:text-black/70 transition-colors">New Application</span>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    )
}
