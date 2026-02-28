'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { AppForm } from '@/components/AppForm'
import { AppWindow, Trash2, ArrowLeft, Copy, Check, Search, Loader2, Building2, Pencil, Mail, Lock } from 'lucide-react'

export default function AppDetailPage() {
    const router = useRouter()
    const params = useParams()
    const appId = params.id as string

    const [app, setApp] = useState<any>(null)
    const [wallets, setWallets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingWallets, setLoadingWallets] = useState(true)
    const [error, setError] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [networkFilter, setNetworkFilter] = useState<'all' | 'mainnet' | 'sepolia'>('all')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (appId) {
            fetchApp()
            fetchWallets()
        }
    }, [appId])

    const fetchApp = async () => {
        try {
            const res = await fetch(`/api/apps/${appId}`)

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/login')
                    return
                }
                throw new Error('Failed to fetch app')
            }

            const data = await res.json()
            setApp(data.app)
        } catch (err) {
            setError('Failed to load application')
        } finally {
            setLoading(false)
        }
    }

    const fetchWallets = async () => {
        try {
            const res = await fetch(`/api/apps/${appId}/wallets`)
            if (res.ok) {
                const data = await res.json()
                setWallets(data.wallets)
            }
        } catch (err) {
            console.error('Failed to fetch wallets', err)
        } finally {
            setLoadingWallets(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/apps/${appId}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                throw new Error('Failed to delete app')
            }

            router.push('/dashboard/apps')
            router.refresh()
        } catch (err) {
            setError('Failed to delete application')
            setDeleting(false)
            setShowDeleteModal(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
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

    if (error || !app) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 mb-4">{error || 'Application not found'}</p>
                    <Link href="/dashboard/apps">
                        <Button variant="outline">Back to Applications</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Back Link */}
            <Link
                href="/dashboard/apps"
                className="inline-flex items-center text-sm text-black/60 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Applications
            </Link>

            {/* Header Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/5 border border-black/10 shrink-0">
                            {app.logo_url ? (
                                <Image
                                    src={app.logo_url}
                                    alt={app.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <AppWindow className="w-8 h-8 text-black/20" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight mb-1">
                                {app.name}
                            </h1>
                            {app.organization && (
                                <Link
                                    href={`/dashboard/organizations/${app.organization.id}`}
                                    className="inline-flex items-center gap-1.5 text-sm text-black/60 hover:text-black transition-colors mb-2"
                                >
                                    <Building2 className="w-3.5 h-3.5" />
                                    {app.organization.name}
                                </Link>
                            )}
                            {app.description && (
                                <p className="text-black/70 max-w-xl mt-1">
                                    {app.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEditModal(true)}
                            icon={<Pencil className="w-4 h-4" />}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDeleteModal(true)}
                            icon={<Trash2 className="w-4 h-4" />}
                        >
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-black/10">
                    <div>
                        <p className="text-xs text-black/60 mb-1">Created</p>
                        <p className="text-sm font-medium">
                            {new Date(app.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-black/60 mb-1">App ID</p>
                        <p className="text-xs font-mono text-black/70 truncate" title={app.id}>
                            {app.id}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Integration Section */}
            <Card>
                <h2 className="text-lg font-semibold mb-4">Integration</h2>
                <p className="text-sm text-black/60 mb-6">
                    Use this App ID to integrate Cavos wallets into your application. Each user's wallet will be identified by this ID.
                </p>

                <div>
                    <label className="block text-xs font-medium text-black/80 mb-2">
                        Application ID
                    </label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-2.5 bg-black/5 border border-black/10 rounded-lg text-sm font-mono text-black/80 truncate">
                            {app.id}
                        </code>
                        <Button
                            variant="outline"
                            onClick={() => copyToClipboard(app.id)}
                            icon={copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Email Verification */}
            <Card>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Email Verification</h2>
                        <p className="text-sm text-black/60">
                            Customize verification emails sent to users during registration with email/password.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/apps/${appId}/emails`)}
                        icon={<Mail className="w-4 h-4" />}
                    >
                        Configure
                    </Button>
                </div>
            </Card>

            {/* Password reset custom email */}
            <Card>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Password reset custom email</h2>
                        <p className="text-sm text-black/60">
                            Customize the email sent when users request a password reset (forgot password).
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/apps/${appId}/emails/password-reset`)}
                        icon={<Lock className="w-4 h-4" />}
                    >
                        Configure
                    </Button>
                </div>
            </Card>

            {/* Wallets Section */}
            <Card noPadding>
                <div className="p-6 border-b border-black/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-1">Wallets</h2>
                            <p className="text-sm text-black/60">
                                Wallets created by your users through this application.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Network Toggle */}
                            <div className="flex bg-black/5 p-1 rounded-lg h-10">
                                {(['all', 'mainnet', 'sepolia'] as const).map((network) => (
                                    <button
                                        key={network}
                                        onClick={() => setNetworkFilter(network)}
                                        className={`px-3 text-xs font-medium rounded-md transition-all capitalize ${networkFilter === network
                                            ? 'bg-white text-black shadow-sm'
                                            : 'text-black/60 hover:text-black'
                                            }`}
                                    >
                                        {network}
                                    </button>
                                ))}
                            </div>

                            {/* Search Input */}
                            <div className="w-full sm:w-64">
                                <Input
                                    placeholder="Search address or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    icon={<Search className="w-4 h-4" />}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loadingWallets ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-black/20" />
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-black/40">No wallets created yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-black/2 border-b border-black/5">
                                    <th className="px-6 py-3 font-medium text-black/60">Address</th>
                                    <th className="px-6 py-3 font-medium text-black/60">Network</th>
                                    <th className="px-6 py-3 font-medium text-black/60">Email</th>
                                    <th className="px-6 py-3 font-medium text-black/60">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {wallets
                                    .filter(wallet => {
                                        const matchesSearch =
                                            wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (wallet.email && wallet.email.toLowerCase().includes(searchTerm.toLowerCase()));
                                        const matchesNetwork = networkFilter === 'all' || wallet.network === networkFilter;
                                        return matchesSearch && matchesNetwork;
                                    })
                                    .map((wallet) => (
                                        <tr
                                            key={wallet.id}
                                            className="group hover:bg-black/2 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/dashboard/apps/${appId}/wallets/${wallet.id}`)}
                                        >
                                            <td className="px-6 py-4 font-mono text-black/80 group-hover:text-black">
                                                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="neutral" className="capitalize">{wallet.network}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-black/80">{wallet.email || '-'}</td>
                                            <td className="px-6 py-4 text-black/60">
                                                {new Date(wallet.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {wallets.filter(wallet => {
                            const matchesSearch =
                                wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (wallet.email && wallet.email.toLowerCase().includes(searchTerm.toLowerCase()));
                            const matchesNetwork = networkFilter === 'all' || wallet.network === networkFilter;
                            return matchesSearch && matchesNetwork;
                        }).length === 0 && (
                                <div className="text-center py-12 border-t border-black/5">
                                    <p className="text-black/40">No wallets found matching your filters.</p>
                                </div>
                            )}
                    </div>
                )}
            </Card>

            {/* Edit Modal */}
            {showEditModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => setShowEditModal(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-semibold mb-6">Edit Application</h3>
                            <AppForm
                                mode="edit"
                                initialData={app}
                                onCancel={() => setShowEditModal(false)}
                                onSuccess={() => {
                                    setShowEditModal(false)
                                    fetchApp()
                                }}
                            />
                        </Card>
                    </div>
                </>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => !deleting && setShowDeleteModal(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-md">
                            <h3 className="text-xl font-semibold mb-2">Delete Application</h3>
                            <p className="text-black/70 mb-6 text-sm">
                                Are you sure you want to delete <strong>{app.name}</strong>? This action cannot be undone.
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
