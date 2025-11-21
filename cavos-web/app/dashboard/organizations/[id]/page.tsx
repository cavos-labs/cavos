'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Building2, AppWindow, Trash2, ArrowLeft, Plus, Loader2 } from 'lucide-react'

export default function OrganizationDetailPage() {
    const router = useRouter()
    const params = useParams()
    const organizationId = params.id as string

    const [organization, setOrganization] = useState<any>(null)
    const [apps, setApps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (organizationId) {
            fetchOrganization()
            fetchApps()
        }
    }, [organizationId])

    const fetchOrganization = async () => {
        try {
            const res = await fetch(`/api/organizations/${organizationId}`)

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/login')
                    return
                }
                throw new Error('Failed to fetch organization')
            }

            const data = await res.json()
            setOrganization(data.organization)
        } catch (err) {
            setError('Failed to load organization')
        } finally {
            setLoading(false)
        }
    }

    const fetchApps = async () => {
        try {
            const res = await fetch(`/api/apps?organization_id=${organizationId}`)

            if (res.ok) {
                const data = await res.json()
                setApps(data.apps || [])
            }
        } catch (err) {
            console.error('Failed to fetch apps:', err)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/organizations/${organizationId}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                throw new Error('Failed to delete organization')
            }

            router.push('/dashboard/organizations')
            router.refresh()
        } catch (err) {
            setError('Failed to delete organization')
            setDeleting(false)
            setShowDeleteModal(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-black/20" />
            </div>
        )
    }

    if (error || !organization) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 mb-4">{error || 'Organization not found'}</p>
                    <Link href="/dashboard/organizations">
                        <Button variant="outline">Back to Organizations</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Back Link */}
            <Link
                href="/dashboard/organizations"
                className="inline-flex items-center text-sm text-black/60 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Organizations
            </Link>

            {/* Header Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-4 bg-black/5 rounded-xl">
                            <Building2 className="w-8 h-8 text-black/80" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight mb-1">
                                {organization.name}
                            </h1>
                            <p className="text-black/50 font-mono text-sm mb-2">
                                {organization.slug}
                            </p>
                            {organization.description && (
                                <p className="text-black/70 max-w-xl">
                                    {organization.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowDeleteModal(true)}
                        icon={<Trash2 className="w-4 h-4" />}
                    >
                        Delete
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-6 border-t border-black/10">
                    <div>
                        <p className="text-xs text-black/60 mb-1">Applications</p>
                        <p className="text-xl font-semibold">{apps.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-black/60 mb-1">Created</p>
                        <p className="text-sm font-medium">
                            {new Date(organization.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-black/60 mb-1">ID</p>
                        <p className="text-xs font-mono text-black/70 truncate" title={organization.id}>
                            {organization.id}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Applications Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Applications</h2>
                    <Link href={`/dashboard/apps/new?org=${organizationId}`}>
                        <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                            Create App
                        </Button>
                    </Link>
                </div>

                {apps.length === 0 ? (
                    <Card className="py-12 text-center">
                        <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AppWindow className="w-6 h-6 text-black/40" />
                        </div>
                        <h3 className="font-semibold mb-1">No applications yet</h3>
                        <p className="text-sm text-black/60 mb-4">
                            Create your first application for this organization
                        </p>
                        <Link href={`/dashboard/apps/new?org=${organizationId}`}>
                            <Button variant="outline" size="sm">Create Application</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {apps.map((app) => (
                            <Link key={app.id} href={`/dashboard/apps/${app.id}`}>
                                <Card className="h-full hover:border-black/30 transition-colors cursor-pointer group">
                                    <div className="flex items-start gap-3">
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black/5 border border-black/10 shrink-0">
                                            {app.logo_url ? (
                                                <Image
                                                    src={app.logo_url}
                                                    alt={app.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <AppWindow className="w-5 h-5 text-black/20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium truncate mb-1">{app.name}</h3>
                                            {app.description && (
                                                <p className="text-xs text-black/60 line-clamp-2">
                                                    {app.description}
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

            {/* Delete Modal */}
            {showDeleteModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => !deleting && setShowDeleteModal(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-md">
                            <h3 className="text-xl font-semibold mb-2">Delete Organization</h3>
                            <p className="text-black/70 mb-6 text-sm">
                                Are you sure you want to delete <strong>{organization.name}</strong>? This action cannot be undone and will also delete all associated applications.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="danger"
                                    className="flex-1"
                                    onClick={handleDelete}
                                    loading={deleting}
                                >
                                    Delete
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
