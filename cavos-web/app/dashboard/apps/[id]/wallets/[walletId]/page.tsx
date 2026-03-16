'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wallet, Loader2, Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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

export default function WalletDetailPage() {
    const router = useRouter()
    const params = useParams()
    const appId = params.id as string
    const walletId = params.walletId as string

    const [wallet, setWallet] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (appId && walletId) fetchData()
    }, [appId, walletId])

    const fetchData = async () => {
        try {
            const walletRes = await fetch(`/api/apps/${appId}/wallets/${walletId}`)
            if (!walletRes.ok) throw new Error('Failed to fetch wallet')
            const walletData = await walletRes.json()
            setWallet(walletData.wallet)

            const txRes = await fetch(`/api/apps/${appId}/wallets/${walletId}/transactions`)
            if (txRes.ok) {
                const txData = await txRes.json()
                setTransactions(txData.transactions)
            }
        } catch {
            setError('Failed to load wallet details')
        } finally {
            setLoading(false)
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

    if (error || !wallet) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 mb-4">{error || 'Wallet not found'}</p>
                    <Link href={`/dashboard/apps/${appId}`}>
                        <Button variant="outline">Back to App</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5 animate-fadeIn">

            {/* Back */}
            <Link
                href={`/dashboard/apps/${appId}`}
                className="inline-flex items-center gap-1.5 text-sm text-black/40 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to App
            </Link>

            {/* ── Wallet Header ─────────────────────────────── */}
            <div className="bg-[#0A0908] rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 100% 50%, #EAE5DC06 0%, transparent 60%)' }} />

                <div className="relative flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/[0.1] flex items-center justify-center shrink-0">
                            <Wallet className="w-5 h-5 text-white/40" />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-bold mb-0.5">Wallet</div>
                            <NetworkBadge network={wallet.network} />
                        </div>
                    </div>
                </div>

                {/* Full address */}
                <div className="relative space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-bold">Address</div>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono text-white/60 break-all leading-relaxed">
                            {wallet.address}
                        </code>
                        <button
                            onClick={() => copyToClipboard(wallet.address)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.07] border border-white/[0.1] hover:bg-white/[0.12] transition-all shrink-0"
                            title="Copy address"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-[#EAE5DC]" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                        </button>
                    </div>
                </div>

                {/* Meta row */}
                <div className="relative mt-6 pt-5 border-t border-white/[0.07] flex flex-wrap gap-6">
                    <div className="space-y-0.5">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-bold">Created</div>
                        <div className="text-sm font-medium text-white">{new Date(wallet.created_at).toLocaleString()}</div>
                    </div>
                    <div className="space-y-0.5">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-bold">Transactions</div>
                        <div className="text-sm font-bold text-white tabular-nums">{transactions.length}</div>
                    </div>
                </div>
            </div>

            {/* ── Transactions ──────────────────────────────── */}
            <div className="bg-white border border-[#EAE5DC] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EAE5DC] flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Transactions</h2>
                    <span className="text-[11px] text-black/35 font-medium">{transactions.length} total</span>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-10 h-10 rounded-xl bg-[#F7F5F2] border border-[#EAE5DC] flex items-center justify-center mx-auto mb-3">
                            <ExternalLink className="w-5 h-5 text-black/20" />
                        </div>
                        <p className="text-sm text-black/35">No transactions yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#F7F5F2] border-b border-[#EAE5DC]">
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black/35">#</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black/35">Date</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black/35">Network</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx, i) => (
                                    <tr
                                        key={tx.id}
                                        className={`transition-colors hover:bg-[#F7F5F2]/70 ${i < transactions.length - 1 ? 'border-b border-[#EAE5DC]/60' : ''}`}
                                    >
                                        <td className="px-5 py-3.5 text-xs font-mono text-black/30 tabular-nums">{String(i + 1).padStart(2, '0')}</td>
                                        <td className="px-5 py-3.5 text-xs text-black/55">
                                            {new Date(tx.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <NetworkBadge network={tx.network} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
