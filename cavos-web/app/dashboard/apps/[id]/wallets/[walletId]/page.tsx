'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Wallet, ExternalLink, Loader2 } from 'lucide-react'

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
        <div className="space-y-8 animate-fadeIn">
            {/* Back Link */}
            <Link
                href={`/dashboard/apps/${appId}`}
                className="inline-flex items-center text-sm text-black/60 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to App
            </Link>

            {/* Wallet Header */}
            <Card>
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-4 bg-black/5 rounded-xl">
                        <Wallet className="w-8 h-8 text-black/80" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight mb-1">
                            Wallet Details
                        </h1>
                        <p className="font-mono text-sm text-black/60 break-all">
                            {wallet.address}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-black/10">
                    <div>
                        <p className="text-xs text-black/60 mb-1">Network</p>
                        <Badge variant="neutral" className="capitalize">{wallet.network}</Badge>
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
            </Card>

            {/* Transactions Section */}
            <Card noPadding>
                <div className="p-6 border-b border-black/10">
                    <h2 className="text-lg font-semibold">Transactions</h2>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-black/40">No transactions found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-black/2 border-b border-black/5">
                                    <th className="px-6 py-3 font-medium text-black/60">Hash</th>
                                    <th className="px-6 py-3 font-medium text-black/60">Date</th>
                                    <th className="px-6 py-3 font-medium text-black/60 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-black/2 transition-colors">
                                        <td className="px-6 py-4 font-mono text-black/80">
                                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                                        </td>
                                        <td className="px-6 py-4 text-black/60">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`https://${wallet.network === 'mainnet' ? '' : 'sepolia.'}starkscan.co/tx/${tx.hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-blue-600 hover:underline"
                                            >
                                                View on Explorer
                                                <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    )
}
