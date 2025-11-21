'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AppWindow, Plus, Loader2 } from 'lucide-react'

export default function AppsPage() {
    const router = useRouter()
    const [apps, setApps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchApps()
    }, [])

    const fetchApps = async () => {
        try {
            const res = await fetch('/api/apps')

            if (!res.ok) {
                if (res.status === 401) {
                    router.push('/login')
                    return
                }
                throw new Error('Failed to fetch apps')
            }

            const data = await res.json()
            setApps(data.apps || [])
        } catch (err) {
            setError('Failed to load applications')
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

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">
                        Applications
                    </h1>
                    <p className="text-black/60">
                        Manage your applications with embedded wallets
                    </p>
                </div>
                <Link href="/dashboard/apps/new">
                    <Button icon={<Plus className="w-4 h-4" />}>
                        Create Application
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            {apps.length === 0 ? (
                <Card className="py-12 text-center">
                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AppWindow className="w-8 h-8 text-black/40" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                    <p className="text-black/60 mb-6">
                        Create your first application to get started
                    </p>
                    <Link href="/dashboard/apps/new">
                        <Button variant="outline">Create Application</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.map((app) => (
                        <Link key={app.id} href={`/dashboard/apps/${app.id}`}>
                            <Card className="h-full hover:border-black/30 transition-colors cursor-pointer group">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-black/5 rounded-xl group-hover:bg-black/10 transition-colors">
                                        <AppWindow className="w-6 h-6 text-black/80" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate mb-1">{app.name}</h3>
                                        {app.organization && (
                                            <p className="text-sm text-black/50 mb-2">
                                                {app.organization.name}
                                            </p>
                                        )}
                                        {app.description && (
                                            <p className="text-sm text-black/60 line-clamp-2">
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
    )
}
