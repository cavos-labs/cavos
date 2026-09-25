'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { useOrganization } from '@/lib/hooks/useOrganization'

export default function NewOrganizationPage() {
    const router = useRouter()
    const { setOrganizationId } = useOrganization()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    // A new account lands here with nothing to go back to.
    const [onboarding, setOnboarding] = useState(false)

    useEffect(() => {
        setOnboarding(new URLSearchParams(window.location.search).get('onboarding') === '1')
    }, [])

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
                setError(data.error || 'Could not create the organization. Try again.')
                setLoading(false)
                return
            }

            if (data.organization?.id) setOrganizationId(data.organization.id)
            router.push(onboarding ? '/dashboard?onboarding=1' : '/dashboard/organizations')
            router.refresh()
        } catch {
            setError('Could not reach Cavos. Check your connection and try again.')
            setLoading(false)
        }
    }

    return (
        <div className={`mx-auto max-w-xl space-y-8 ${onboarding ? 'pt-6 lg:pt-16' : ''}`}>
            {!onboarding && (
                <Link
                    href="/dashboard/organizations"
                    className="inline-flex items-center text-sm text-muted transition-colors hover:text-ink"
                >
                    <Icon.ArrowLeft className="mr-1 h-4 w-4" />
                    Back to organizations
                </Link>
            )}

            <div data-dash-header>
                {onboarding && <p className="mb-3 text-sm text-muted">Step 1 of 2</p>}
                <h1 className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-ink text-balance md:text-[28px]">
                    {onboarding ? 'Create your organization' : 'New organization'}
                </h1>
                <p className="mt-2 max-w-prose text-sm text-muted text-pretty">
                    {onboarding
                        ? 'Your organization owns your apps, billing and team. Use your company or project name; you can change it later.'
                        : 'Use a separate organization for a separate company, client or billing account.'}
                </p>
            </div>

            <Panel>
                {error && (
                    <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="name"
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Acme Inc"
                        required
                        autoFocus
                        autoComplete="organization"
                        disabled={loading}
                    />

                    <div>
                        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-black/80">
                            Description <span className="font-normal text-muted">(optional)</span>
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What you are building"
                            disabled={loading}
                            rows={3}
                            className="w-full resize-none rounded-lg border border-black/10 bg-white px-4 py-2 text-sm transition-[border-color,box-shadow,opacity] duration-150 focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        {!onboarding && (
                            <Link href="/dashboard/organizations">
                                <Button type="button" variant="outline" className="w-full sm:w-auto">
                                    Cancel
                                </Button>
                            </Link>
                        )}
                        <Button type="submit" loading={loading} disabled={!name.trim()} className="w-full sm:w-auto">
                            {onboarding ? 'Continue' : 'Create organization'}
                        </Button>
                    </div>
                </form>
            </Panel>
        </div>
    )
}
