'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'

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
                title="Organizations"
                subtitle="Manage your organizations and their applications."
                actions={
                    <Link href="/dashboard/organizations/new">
                        <Button icon={<Icon.Add size={15} weight="bold" />}>
                            New Organization
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
            {organizations.length === 0 ? (
                <div data-dash-panel className="relative overflow-hidden rounded-2xl bg-ink text-white p-8 border border-black/10">
                    <div
                        className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at top right, #402AFF1F 0%, transparent 65%)' }}
                    />
                    <div className="relative space-y-4 max-w-md">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center">
                            <Icon.Org size={20} className="text-white/55" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">No organizations yet</h3>
                            <p className="text-sm text-white/40 leading-relaxed">
                                Create an organization to group your apps and manage API keys.
                            </p>
                        </div>
                        <Link href="/dashboard/organizations/new">
                            <Button size="sm" className="bg-white/10 text-white hover:bg-white/16 border border-white/10 rounded-xl mt-1">
                                Create Organization
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div data-dash-panel className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {organizations.map((org) => (
                        <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
                            <div className="group h-full bg-white border border-black/[0.08] rounded-2xl p-6 hover:border-black/[0.18] hover:shadow-md hover:shadow-black/[0.05] transition-all">
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
                            <span className="text-xs font-semibold text-black/40 group-hover:text-black/70 transition-colors">New Organization</span>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    )
}
