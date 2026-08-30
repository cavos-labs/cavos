'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
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
                if (res.status === 401) { router.push('/login'); return }
                throw new Error('Failed to fetch organization')
            }
            const data = await res.json()
            setOrganization(data.organization)
        } catch {
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
            const res = await fetch(`/api/organizations/${organizationId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete organization')
            router.push('/dashboard/organizations')
            router.refresh()
        } catch {
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
            if (!res.ok) { setCreateKeyError(data.error || 'Failed to create key'); return }
            setRevealedKey(data.plaintext)
            setNewKeyName('')
            setShowCreateKeyModal(false)
            setApiKeys(prev => [data.key, ...prev])
        } catch {
            setCreateKeyError('Failed to create key')
        } finally {
            setCreatingKey(false)
        }
    }

    const handleRevokeKey = async (keyId: string) => {
        setRevokingKeyId(keyId)
        try {
            const res = await fetch(`/api/organizations/${organizationId}/api-keys/${keyId}`, { method: 'DELETE' })
            if (res.ok) setApiKeys(prev => prev.filter(k => k.id !== keyId))
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
                <Icon.Spinner className="w-8 h-8 animate-spin text-black/20" />
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
        <div className="space-y-5 animate-fadeIn">

            {/* Back */}
            <Link
                href="/dashboard/organizations"
                className="inline-flex items-center gap-1.5 text-sm text-black/40 hover:text-black transition-colors"
            >
                <Icon.ArrowLeft className="w-3.5 h-3.5" />
                Organizations
            </Link>

            <div data-dash-header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <p className="mb-2 text-[11px] font-medium text-muted">Workspace</p>
                    <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink md:text-[28px] leading-tight">{organization.name}</h1>
                    <p className="mt-2 font-mono text-xs text-muted">{organization.slug}</p>
                    {organization.description && (
                        <p className="mt-2 max-w-2xl text-sm text-muted">{organization.description}</p>
                    )}
                    <dl className="mt-4 flex flex-wrap gap-6 text-sm">
                        <div><dt className="text-[11px] text-muted">Applications</dt><dd className="font-mono tabular-nums">{apps.length}</dd></div>
                        <div><dt className="text-[11px] text-muted">Created</dt><dd className="font-mono tabular-nums">{new Date(organization.created_at).toLocaleDateString()}</dd></div>
                    </dl>
                </div>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft"
                >
                    <Icon.Delete className="h-3.5 w-3.5" />
                    Delete
                </button>
            </div>

            {/* ── Applications ────────────────────────────── */}
            <div data-dash-panel className="bg-white border border-line rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-surface border border-line flex items-center justify-center shrink-0">
                            <Icon.Apps className="w-3.5 h-3.5 text-black/40" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold leading-none">Applications</h2>
                            <p className="text-[11px] text-black/35 mt-0.5">{apps.length} app{apps.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <Link
                        href={`/dashboard/apps/new?org=${organizationId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-all active:scale-95"
                    >
                        <Icon.Add className="w-3.5 h-3.5" />
                        New App
                    </Link>
                </div>

                {apps.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center mx-auto mb-3">
                            <Icon.Apps className="w-5 h-5 text-black/20" />
                        </div>
                        <p className="text-sm text-black/35">No applications yet.</p>
                        <p className="text-xs text-black/25 mt-1">Create your first app for this organization.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-line/60">
                        {apps.map((app) => (
                            <Link
                                key={app.id}
                                href={`/dashboard/apps/${app.id}`}
                                className="group flex items-center gap-4 px-5 py-3.5 hover:bg-surface/70 transition-colors"
                            >
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-surface border border-line shrink-0 flex items-center justify-center">
                                    {app.logo_url ? (
                                        <Image src={app.logo_url} alt={app.name} fill className="object-cover" />
                                    ) : (
                                        <Icon.Apps className="w-4 h-4 text-black/25" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-black truncate">{app.name}</p>
                                    {app.description && (
                                        <p className="text-xs text-black/40 truncate mt-0.5">{app.description}</p>
                                    )}
                                </div>
                                <Icon.ChevronRight className="w-3.5 h-3.5 text-black/20 group-hover:text-black/50 transition-colors shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div data-dash-panel className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold">API keys</h2>
                        <p className="mt-1 text-xs text-muted">Create and revoke keys from the workspace API keys page.</p>
                    </div>
                    <Link
                        href="/dashboard/api-keys"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover"
                    >
                        Manage keys
                        <Icon.ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            {/* ── Create Key Modal ─────────────────────────── */}
            {showCreateKeyModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => !creatingKey && setShowCreateKeyModal(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl border border-line p-6 w-full max-w-md shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Generate API Key</h3>
                                <button
                                    onClick={() => setShowCreateKeyModal(false)}
                                    disabled={creatingKey}
                                    className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black rounded-lg hover:bg-black/5 transition-colors"
                                >
                                    <Icon.Close className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-black/45 mb-5">
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
                                <p className="text-xs text-red-600 mt-2">{createKeyError}</p>
                            )}
                            <div className="flex gap-2.5 mt-5">
                                <button
                                    onClick={handleCreateKey}
                                    disabled={creatingKey || !newKeyName.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-hover disabled:opacity-50 transition-all"
                                >
                                    {creatingKey ? <Icon.Spinner className="w-4 h-4 animate-spin" /> : <Icon.Key className="w-4 h-4" />}
                                    Generate
                                </button>
                                <button
                                    onClick={() => setShowCreateKeyModal(false)}
                                    disabled={creatingKey}
                                    className="flex-1 px-4 py-2.5 bg-surface border border-line text-sm font-semibold rounded-xl hover:border-line-strong disabled:opacity-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Revealed Key Modal ───────────────────────── */}
            {revealedKey && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl border border-line p-6 w-full max-w-lg shadow-xl">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center">
                                    <Icon.Key className="w-4 h-4 text-black/50" />
                                </div>
                                <h3 className="text-lg font-bold">API Key Generated</h3>
                            </div>
                            <p className="text-sm text-black/45 mb-5">
                                Copy this key now — it won&apos;t be shown again.
                            </p>

                            <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
                                <code className="text-xs font-mono flex-1 break-all text-black/65 leading-relaxed">
                                    {revealedKey}
                                </code>
                                <button
                                    onClick={() => handleCopy(revealedKey)}
                                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-line hover:border-line-strong text-black/40 hover:text-black transition-all"
                                    title="Copy"
                                >
                                    {copied ? <Icon.Check className="w-3.5 h-3.5 text-black" /> : <Icon.Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>

                            <div className="mt-3 px-4 py-3 bg-surface border border-line rounded-xl">
                                <p className="text-xs text-black/45">
                                    Store this key securely. It cannot be recovered after closing this dialog.
                                </p>
                            </div>

                            <button
                                onClick={() => setRevealedKey(null)}
                                className="w-full mt-5 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-hover transition-all"
                            >
                                I&apos;ve saved it, close
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── Delete Modal ─────────────────────────────── */}
            {showDeleteModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl border border-line p-6 w-full max-w-md shadow-xl">
                            <h3 className="text-lg font-bold mb-1">Delete Organization</h3>
                            <p className="text-sm text-black/50 mb-6">
                                Are you sure you want to delete <strong className="text-black">{organization.name}</strong>? This will also delete all associated applications and cannot be undone.
                            </p>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-all"
                                >
                                    {deleting ? <Icon.Spinner className="w-4 h-4 animate-spin" /> : <Icon.Delete className="w-4 h-4" />}
                                    Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 bg-surface border border-line text-sm font-semibold rounded-xl hover:border-line-strong disabled:opacity-60 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
