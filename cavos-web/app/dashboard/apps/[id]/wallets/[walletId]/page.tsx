'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'

export default function WalletDetailPage() {
    const router = useRouter()
    const params = useParams()
    const appId = params.id as string
    const walletId = params.walletId as string

    const [wallet, setWallet] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (appId && walletId) {
            fetchData()
        }
    }, [appId, walletId])

    const fetchData = async () => {
        try {
            // Fetch wallet details
            const walletRes = await fetch(`/api/apps/${appId}/wallets/${walletId}`)
            if (!walletRes.ok) throw new Error('Failed to fetch wallet')
            const walletData = await walletRes.json()
            setWallet(walletData.wallet)

            // Fetch transactions
            const txRes = await fetch(`/api/apps/${appId}/wallets/${walletId}/transactions`)
            if (txRes.ok) {
                const txData = await txRes.json()
                setTransactions(txData.transactions)
            }
        } catch (err) {
            setError('Failed to load wallet details')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FFFFFF]">
                <Header />
                <div className="pt-20">
                    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
                        <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                    </div>
                </div>
            </main>
        )
    }

    if (error || !wallet) {
        return (
            <main className="min-h-screen bg-[#FFFFFF]">
                <Header />
                <div className="pt-20 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                            <p className="text-red-600 mb-4">{error || 'Wallet not found'}</p>
                            <Link href={`/dashboard/apps/${appId}`} className="inline-block px-6 py-2.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm">
                                Back to App
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#FFFFFF]">
            <Header />

            <div className="pt-20">
                {/* Sidebar - Hidden on mobile */}
                <aside className="hidden md:block fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white border-r border-black/10 p-6">
                    <nav className="space-y-2">
                        <Link href="/dashboard" className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                            Overview
                        </Link>
                        <Link href="/dashboard/organizations" className="block px-4 py-2.5 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                            Organizations
                        </Link>
                        <Link href="/dashboard/apps" className="block px-4 py-2.5 text-sm font-medium bg-black/5 text-black rounded-lg">
                            Applications
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <div className="md:ml-64 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Back Link */}
                        <Link
                            href={`/dashboard/apps/${appId}`}
                            className="inline-flex items-center text-sm text-black/60 hover:text-black mb-4 md:mb-6"
                        >
                            ← Back to App
                        </Link>

                        {/* Wallet Header */}
                        <div className="bg-white border border-black/10 rounded-2xl p-5 md:p-8 mb-4 md:mb-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center shrink-0">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="5" width="20" height="14" rx="2" />
                                        <line x1="2" y1="10" x2="22" y2="10" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-[-0.02em] mb-1">
                                        Wallet Details
                                    </h1>
                                    <p className="text-black/60 font-mono text-sm">
                                        {wallet.address}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-black/10">
                                <div>
                                    <p className="text-xs text-black/60 mb-1">Network</p>
                                    <p className="text-sm font-medium capitalize">{wallet.network}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-black/60 mb-1">User Email</p>
                                    <p className="text-sm font-medium">{wallet.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-black/60 mb-1">Created</p>
                                    <p className="text-sm font-medium">
                                        {new Date(wallet.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transactions Section */}
                        <div className="bg-white border border-black/10 rounded-2xl p-5 md:p-8">
                            <h2 className="text-xl font-semibold tracking-[-0.02em] mb-4">
                                Transactions
                            </h2>

                            {transactions.length === 0 ? (
                                <div className="text-center py-8 bg-black/5 rounded-xl border border-black/5">
                                    <p className="text-black/60">No transactions found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-black/10">
                                                <th className="pb-3 font-medium text-black/60">Hash</th>
                                                <th className="pb-3 font-medium text-black/60">Status</th>
                                                <th className="pb-3 font-medium text-black/60">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/5">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="group hover:bg-black/5 transition-colors">
                                                    <td className="py-3 font-mono text-black/80">
                                                        <a
                                                            href={`https://${wallet.network === 'mainnet' ? '' : 'sepolia.'}starkscan.co/tx/${tx.hash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="hover:underline text-blue-600"
                                                        >
                                                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                                                        </a>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'success' ? 'bg-green-100 text-green-700' :
                                                                tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-black/60">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
