'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft } from 'lucide-react'

export default function NewOrganizationPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to create organization')
                setLoading(false)
                return
            }

            router.push('/dashboard/organizations')
            router.refresh()
        } catch (err) {
            setError('An unexpected error occurred')
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
            {/* Back Link */}
            <Link
                href="/dashboard/organizations"
                className="inline-flex items-center text-sm text-black/60 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Organizations
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-semibold tracking-tight mb-2">
                    Create Organization
                </h1>
                <p className="text-black/60">
                    Organizations help you manage multiple applications
                </p>
            </div>

            {/* Form */}
            <Card>
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-black/80 mb-2">
                            Organization Name *
                        </label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Acme Inc"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-black/80 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A brief description of your organization"
                            disabled={loading}
                            rows={4}
                            className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-black/30 transition-colors disabled:opacity-50 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            loading={loading}
                            className="flex-1"
                        >
                            Create Organization
                        </Button>
                        <Link href="/dashboard/organizations" className="flex-1">
                            <Button variant="outline" className="w-full">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    )
}
