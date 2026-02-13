'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
    Building2, AppWindow, Trash2, ArrowLeft, Plus, Loader2,
    Key, Copy, Check, X
} from 'lucide-react'

interface ApiKey {
    id: string
    name: string
    key_prefix: string
    is_active: boolean
    last_used_at: string | null
    created_at: string
}

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

    // API Keys state
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [keysLoading, setKeysLoading] = useState(true)
    const [showCreateKeyModal, setShowCreateKeyModal] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [creatingKey, setCreatingKey] = useState(false)
    const [createKeyError, setCreateKeyError] = useState('')
    const [revealedKey, setRevealedKey] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null)

    useEffect(() => {
        if (organizationId) {
            fetchOrganization()
            fetchApps()
            fetchApiKeys()
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

    const fetchApiKeys = async () => {
        try {
            setKeysLoading(true)
            const res = await fetch(`/api/organizations/${organizationId}/api-keys`)
            if (res.ok) {
                const data = await res.json()
                setApiKeys(data.keys || [])
            }
        } catch (err) {
            console.error('Failed to fetch api keys:', err)
        } finally {
            setKeysLoading(false)
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

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return
        setCreatingKey(true)
        setCreateKeyError('')

        try {
            const res = await fetch(`/api/organizations/${organizationId}/api-keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName.trim() }),
            })

            const data = await res.json()

            if (!res.ok) {
                setCreateKeyError(data.error || 'Failed to create key')
                return
            }

            setRevealedKey(data.plaintext)
            setNewKeyName('')
            setShowCreateKeyModal(false)
            setApiKeys(prev => [data.key, ...prev])
        } catch (err) {
            setCreateKeyError('Failed to create key')
        } finally {
            setCreatingKey(false)
        }
    }

    const handleRevokeKey = async (keyId: string) => {
        setRevokingKeyId(keyId)
        try {
            const res = await fetch(
                `/api/organizations/${organizationId}/api-keys/${keyId}`,
                { method: 'DELETE' }
            )

            if (res.ok) {
                setApiKeys(prev => prev.filter(k => k.id !== keyId))
            }
        } catch (err) {
            console.error('Failed to revoke key:', err)
        } finally {
            setRevokingKeyId(null)
        }
    }

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
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

            {/* API Keys Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">API Keys</h2>
                        <p className="text-sm text-black/50 mt-0.5">
                            Use these keys to create apps programmatically via the API.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        icon={<Key className="w-4 h-4" />}
                        onClick={() => setShowCreateKeyModal(true)}
                    >
                        Generate Key
                    </Button>
                </div>

                {keysLoading ? (
                    <Card className="py-8 flex justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-black/20" />
                    </Card>
                ) : apiKeys.length === 0 ? (
                    <Card className="py-10 text-center">
                        <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key className="w-6 h-6 text-black/30" />
                        </div>
                        <h3 className="font-semibold mb-1">No API keys yet</h3>
                        <p className="text-sm text-black/60 mb-4">
                            Generate a key to create apps via the REST API
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setShowCreateKeyModal(true)}>
                            Generate API Key
                        </Button>
                    </Card>
                ) : (
                    <Card noPadding>
                        <div className="divide-y divide-black/5">
                            {apiKeys.map((apiKey) => (
                                <div
                                    key={apiKey.id}
                                    className="flex items-center justify-between gap-4 px-6 py-4"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 bg-black/5 rounded-lg shrink-0">
                                            <Key className="w-4 h-4 text-black/50" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{apiKey.name}</p>
                                            <p className="text-xs font-mono text-black/40 mt-0.5">
                                                {apiKey.key_prefix}••••••••••••••••••••••
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="hidden sm:block text-right">
                                            <p className="text-xs text-black/40">
                                                {apiKey.last_used_at
                                                    ? `Last used ${new Date(apiKey.last_used_at).toLocaleDateString()}`
                                                    : 'Never used'}
                                            </p>
                                            <p className="text-xs text-black/30 mt-0.5">
                                                Created {new Date(apiKey.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant={apiKey.is_active ? 'success' : 'neutral'}>
                                            {apiKey.is_active ? 'Active' : 'Revoked'}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            loading={revokingKeyId === apiKey.id}
                                            onClick={() => handleRevokeKey(apiKey.id)}
                                        >
                                            Revoke
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* API usage hint */}
                <div className="bg-black/[0.02] border border-black/5 rounded-xl p-4">
                    <p className="text-xs text-black/50 font-mono leading-relaxed">
                        <span className="text-black/30">POST</span> https://cavos.xyz/api/v1/apps<br />
                        <span className="text-black/30">Authorization:</span> Bearer cav_••••••••••••
                    </p>
                </div>
            </div>

            {/* Create Key Modal */}
            {showCreateKeyModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => !creatingKey && setShowCreateKeyModal(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-md">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Generate API Key</h3>
                                <button
                                    onClick={() => setShowCreateKeyModal(false)}
                                    className="text-black/30 hover:text-black/60 transition-colors"
                                    disabled={creatingKey}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-black/60 mb-5">
                                Give this key a name to identify where it&apos;s used (e.g. &quot;CI Pipeline&quot;, &quot;Backend Service&quot;).
                            </p>
                            <Input
                                label="Key name"
                                placeholder="My Backend Service"
                                value={newKeyName}
                                onChange={e => setNewKeyName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateKey()}
                                disabled={creatingKey}
                                autoFocus
                            />
                            {createKeyError && (
                                <p className="text-sm text-red-600 mt-2">{createKeyError}</p>
                            )}
                            <div className="flex gap-3 mt-5">
                                <Button
                                    className="flex-1"
                                    onClick={handleCreateKey}
                                    loading={creatingKey}
                                    disabled={!newKeyName.trim()}
                                >
                                    Generate
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowCreateKeyModal(false)}
                                    disabled={creatingKey}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </Card>
                    </div>
                </>
            )}

            {/* Revealed Key Modal — shown once after creation */}
            {revealedKey && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-lg">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Key className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold">API Key Generated</h3>
                            </div>
                            <p className="text-sm text-black/60 mb-5">
                                Copy this key now — it won&apos;t be shown again.
                            </p>

                            <div className="bg-black/[0.03] border border-black/10 rounded-xl p-4 flex items-center gap-3">
                                <code className="text-sm font-mono flex-1 break-all text-black/80">
                                    {revealedKey}
                                </code>
                                <button
                                    onClick={() => handleCopy(revealedKey)}
                                    className="shrink-0 p-2 rounded-lg hover:bg-black/5 text-black/50 hover:text-black transition-colors"
                                    title="Copy"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-xs text-yellow-800">
                                    Store this key securely. It cannot be recovered after closing this dialog.
                                </p>
                            </div>

                            <Button
                                className="w-full mt-5"
                                onClick={() => setRevealedKey(null)}
                            >
                                I&apos;ve saved it, close
                            </Button>
                        </Card>
                    </div>
                </>
            )}

            {/* Delete Org Modal */}
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