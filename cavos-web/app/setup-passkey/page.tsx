'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Icon } from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase/client'

export default function SetupPasskeyPage() {
    const router = useRouter()
    const [nextPath, setNextPath] = useState('/dashboard')
    const [supported, setSupported] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            const params = new URLSearchParams(window.location.search)
            const requestedNext = params.get('next')
            if (requestedNext?.startsWith('/') && !requestedNext.startsWith('//')) setNextPath(requestedNext)
            setSupported('PublicKeyCredential' in window)
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [])

    const createPasskey = async () => {
        setError('')
        setLoading(true)

        try {
            const supabase = createClient()
            const { error: passkeyError } = await supabase.auth.registerPasskey()
            if (passkeyError) throw passkeyError
            router.push(nextPath)
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Passkey creation failed')
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <Header />

            <div className="flex min-h-screen items-center justify-center px-4 pb-12 pt-24 md:px-6 md:pb-20 md:pt-32">
                <div className="w-full max-w-md animate-fadeIn text-center">
                    <div className="mb-6 md:mb-8">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
                            <Icon.Key size={26} className="text-brand" />
                        </div>
                        <h1 className="mb-2 text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
                            Create your passkey
                        </h1>
                        <p className="text-sm text-black/55 md:text-base">
                            Sign in securely with this device—no password required.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm shadow-black/[0.03] md:p-8">
                        {error && (
                            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-left">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {!supported ? (
                            <p className="text-sm leading-relaxed text-black/55">
                                This browser or device does not support passkeys.
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={createPasskey}
                                disabled={loading}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 font-semibold text-white transition-all hover:bg-brand-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? <Icon.Spinner size={17} className="animate-spin" /> : <Icon.Key size={17} />}
                                {loading ? 'Waiting for your device…' : 'Create passkey'}
                            </button>
                        )}

                        <Link
                            href={nextPath}
                            className="mt-4 inline-flex text-sm font-medium text-black/50 transition-colors hover:text-black"
                        >
                            Skip for now
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
