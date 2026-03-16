'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AppForm } from '@/components/AppForm'
import { AppWindow, Trash2, ArrowLeft, Copy, Check, Search, Loader2, Building2, Pencil, Mail, Lock, ChevronLeft, ChevronRight, Wallet, ArrowRight, ExternalLink } from 'lucide-react'

const WALLETS_PER_PAGE = 10

function NetworkBadge({ network }: { network: string }) {
    if (network === 'mainnet') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#0A0908] text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EAE5DC]/70" />
                Mainnet
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#F7F5F2] border border-[#EAE5DC] text-black/50">
            <span className="w-1.5 h-1.5 rounded-full bg-black/25" />
            Sepolia
        </span>
    )
}

function truncateAddress(addr: string) {
    if (!addr || addr.length < 16) return addr
    return `${addr.slice(0, 10)}…${addr.slice(-6)}`
}

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
    const [page, setPage] = useState(1)

    useEffect(() => {
        if (appId) {
            fetchApp()
            fetchWallets()
        }
    }, [appId])

    // Reset to page 1 when filter/search changes
    useEffect(() => { setPage(1) }, [searchTerm, networkFilter])

    const fetchApp = async () => {
        try {
            const res = await fetch(`/api/apps/${appId}`)
            if (!res.ok) {
                if (res.status === 401) { router.push('/login'); return }
                throw new Error('Failed to fetch app')
            }
            const data = await res.json()
            setApp(data.app)
        } catch {
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
            const res = await fetch(`/api/apps/${appId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete app')
            router.push('/dashboard/apps')
            router.refresh()
        } catch {
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

    const filteredWallets = useMemo(() => wallets.filter(w => {
        const matchesSearch = w.address.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesNetwork = networkFilter === 'all' || w.network === networkFilter
        return matchesSearch && matchesNetwork
    }), [wallets, searchTerm, networkFilter])

    const totalPages = Math.ceil(filteredWallets.length / WALLETS_PER_PAGE)
    const pagedWallets = filteredWallets.slice((page - 1) * WALLETS_PER_PAGE, page * WALLETS_PER_PAGE)

    const mainnetCount = wallets.filter(w => w.network === 'mainnet').length
    const sepoliaCount = wallets.filter(w => w.network === 'sepolia').length

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
        <div className="space-y-5 animate-fadeIn">

            {/* Back */}
            <Link
                href="/dashboard/apps"
                className="inline-flex items-center gap-1.5 text-sm text-black/40 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Applications
            </Link>

            {/* ── App Header ──────────────────────────────── */}
            <div className="bg-[#0A0908] rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 0% 50%, #EAE5DC08 0%, transparent 60%)' }} />
                <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div className="flex items-start gap-4">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/[0.07] border border-white/[0.1] shrink-0 flex items-center justify-center">
                            {app.logo_url ? (
                                <Image src={app.logo_url} alt={app.name} fill className="object-cover" />
                            ) : (
                                <AppWindow className="w-7 h-7 text-white/30" />
                            )}
                        </div>
                        <div className="space-y-1 min-w-0">
                            <h1 className="text-xl font-bold tracking-tight text-white">{app.name}</h1>
                            {app.organization && (
                                <Link
                                    href={`/dashboard/organizations/${app.organization.id}`}
                                    className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                                >
                                    <Building2 className="w-3 h-3" />
                                    {app.organization.name}
                                </Link>
                            )}
                            {app.description && (
                                <p className="text-sm text-white/35 leading-relaxed pt-0.5">{app.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white border border-white/[0.12] hover:border-white/25 rounded-lg transition-all"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400/70 hover:text-red-400 border border-red-500/[0.15] hover:border-red-500/30 rounded-lg transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Stats mini-bar */}
                <div className="relative mt-6 pt-5 border-t border-white/[0.07] flex flex-wrap gap-6">
                    {[
                        { label: 'Total Wallets', value: wallets.length },
                        { label: 'Mainnet', value: mainnetCount },
                        { label: 'Sepolia', value: sepoliaCount },
                        { label: 'Created', value: new Date(app.created_at).toLocaleDateString() },
                    ].map((s) => (
                        <div key={s.label} className="space-y-0.5">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-bold">{s.label}</div>
                            <div className="text-sm font-bold text-white tabular-nums">{s.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── App ID ──────────────────────────────────── */}
            <div className="bg-white border border-[#EAE5DC] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-sm font-semibold">Application ID</h2>
                        <p className="text-xs text-black/40 mt-0.5">Use this ID when calling the Cavos SDK or API.</p>
                    </div>
                    <a href="https://docs.cavos.xyz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-black/30 hover:text-black transition-colors shrink-0">
                        Docs <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <div className="flex items-center gap-2">
                    <code className="flex-1 px-3.5 py-2.5 bg-[#F7F5F2] border border-[#EAE5DC] rounded-xl text-xs font-mono text-black/60 truncate">
                        {app.id}
                    </code>
                    <button
                        onClick={() => copyToClipboard(app.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0A0908] text-white text-xs font-semibold rounded-xl hover:bg-black/80 transition-all active:scale-95 shrink-0"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#EAE5DC]" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>

            {/* ── Config Cards ────────────────────────────── */}
            <div className="grid sm:grid-cols-2 gap-4">
                <button
                    onClick={() => router.push(`/dashboard/apps/${appId}/emails`)}
                    className="group text-left bg-white border border-[#EAE5DC] hover:border-[#C4BFB6] hover:shadow-sm rounded-2xl p-5 transition-all"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F7F5F2] border border-[#EAE5DC] flex items-center justify-center">
                            <Mail className="w-4 h-4 text-black/40" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-black/20 group-hover:text-black/50 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">Email Verification</h3>
                    <p className="text-xs text-black/40 leading-relaxed">Customize verification emails sent to users on registration.</p>
                </button>

                <button
                    onClick={() => router.push(`/dashboard/apps/${appId}/emails/password-reset`)}
                    className="group text-left bg-white border border-[#EAE5DC] hover:border-[#C4BFB6] hover:shadow-sm rounded-2xl p-5 transition-all"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F7F5F2] border border-[#EAE5DC] flex items-center justify-center">
                            <Lock className="w-4 h-4 text-black/40" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-black/20 group-hover:text-black/50 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">Password Reset Email</h3>
                    <p className="text-xs text-black/40 leading-relaxed">Customize the email sent when users request a password reset.</p>
                </button>
            </div>

            {/* ── Wallets Table ────────────────────────────── */}
            <div className="bg-white border border-[#EAE5DC] rounded-2xl overflow-hidden">

                {/* Table Header */}
                <div className="px-5 py-4 border-b border-[#EAE5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#F7F5F2] border border-[#EAE5DC] flex items-center justify-center shrink-0">
                            <Wallet className="w-3.5 h-3.5 text-black/40" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold leading-none">Wallets</h2>
                            <p className="text-[11px] text-black/35 mt-0.5">
                                {filteredWallets.length} of {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                        {/* Network Toggle */}
                        <div className="flex bg-[#F7F5F2] border border-[#EAE5DC] p-0.5 rounded-lg">
                            {(['all', 'mainnet', 'sepolia'] as const).map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setNetworkFilter(n)}
                                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${networkFilter === n
                                        ? 'bg-white text-black shadow-sm border border-[#EAE5DC]'
                                        : 'text-black/40 hover:text-black'
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search address…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-52 pl-8 pr-3 py-2 text-xs bg-[#F7F5F2] border border-[#EAE5DC] rounded-lg text-black placeholder:text-black/30 focus:outline-none focus:border-black/30 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Body */}
                {loadingWallets ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-5 h-5 animate-spin text-black/20" />
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-10 h-10 rounded-xl bg-[#F7F5F2] border border-[#EAE5DC] flex items-center justify-center mx-auto mb-3">
                            <Wallet className="w-5 h-5 text-black/20" />
                        </div>
                        <p className="text-sm text-black/35">No wallets yet.</p>
                        <p className="text-xs text-black/25 mt-1">Wallets appear here once users register through your app.</p>
                    </div>
                ) : filteredWallets.length === 0 ? (
                    <div className="text-center py-12 border-t border-[#EAE5DC]/60">
                        <p className="text-sm text-black/35">No wallets match your filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F7F5F2] border-b border-[#EAE5DC]">
                                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black/35">Address</th>
                                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black/35">Network</th>
                                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black/35">Created</th>
                                        <th className="px-5 py-3 w-8" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedWallets.map((wallet, i) => (
                                        <tr
                                            key={wallet.id}
                                            onClick={() => router.push(`/dashboard/apps/${appId}/wallets/${wallet.id}`)}
                                            className={`group cursor-pointer transition-colors hover:bg-[#F7F5F2]/70 ${i < pagedWallets.length - 1 ? 'border-b border-[#EAE5DC]/60' : ''}`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="font-mono text-xs text-black/60 group-hover:text-black transition-colors">
                                                    {truncateAddress(wallet.address)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <NetworkBadge network={wallet.network} />
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-black/40">
                                                {new Date(wallet.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <ChevronRight className="w-3.5 h-3.5 text-black/20 group-hover:text-black/50 transition-colors" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#EAE5DC] bg-[#F7F5F2]/50">
                                <span className="text-[11px] text-black/35">
                                    Page {page} of {totalPages} · {filteredWallets.length} results
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#EAE5DC] bg-white text-black/40 hover:text-black hover:border-[#C4BFB6] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Page number buttons */}
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum: number
                                        if (totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (page <= 3) {
                                            pageNum = i + 1
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i
                                        } else {
                                            pageNum = page - 2 + i
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold transition-all ${pageNum === page
                                                    ? 'bg-[#0A0908] text-white border border-[#0A0908]'
                                                    : 'border border-[#EAE5DC] bg-white text-black/40 hover:text-black hover:border-[#C4BFB6]'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    })}

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#EAE5DC] bg-white text-black/40 hover:text-black hover:border-[#C4BFB6] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Edit Modal ───────────────────────────────── */}
            {showEditModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-semibold mb-6">Edit Application</h3>
                            <AppForm
                                mode="edit"
                                initialData={app}
                                onCancel={() => setShowEditModal(false)}
                                onSuccess={() => { setShowEditModal(false); fetchApp() }}
                            />
                        </Card>
                    </div>
                </>
            )}

            {/* ── Delete Modal ─────────────────────────────── */}
            {showDeleteModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl border border-[#EAE5DC] p-6 w-full max-w-md shadow-xl">
                            <h3 className="text-lg font-bold mb-1">Delete Application</h3>
                            <p className="text-sm text-black/50 mb-6">
                                Are you sure you want to delete <strong className="text-black">{app.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-all"
                                >
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 bg-[#F7F5F2] border border-[#EAE5DC] text-sm font-semibold rounded-xl hover:border-[#C4BFB6] disabled:opacity-60 transition-all"
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
