'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Icon } from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [nextPath, setNextPath] = useState('/dashboard')
    const [passkeyLoading, setPasskeyLoading] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const requestedNext = params.get('next')
        const invitedEmail = params.get('email')
        if (requestedNext?.startsWith('/') && !requestedNext.startsWith('//')) setNextPath(requestedNext)
        if (invitedEmail) setEmail(invitedEmail)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Login failed')
                setLoading(false)
                return
            }

            router.push(nextPath)
            router.refresh()
        } catch (err) {
            setError('An unexpected error occurred')
            setLoading(false)
        }
    }

    const signInWithPasskey = async () => {
        setError('')
        setPasskeyLoading(true)
        try {
            const supabase = createClient()
            const { error: passkeyError } = await supabase.auth.signInWithPasskey()
            if (passkeyError) throw passkeyError
            router.push(nextPath)
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Passkey sign-in failed')
        } finally {
            setPasskeyLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#FFFFFF]">
            <Header />

            <div className="pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 flex items-center justify-center min-h-screen">
                <div className="w-full max-w-md animate-fadeIn">
                    {/* Title */}
                    <div className="text-center mb-6 md:mb-8">
                        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-2 text-balance">
                            Welcome back
                        </h1>
                        <p className="text-black/55 text-sm md:text-base">
                            Sign in to your account
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white border border-line rounded-2xl p-6 md:p-8 shadow-sm shadow-black/[0.03]">
                        <button
                            type="button"
                            onClick={signInWithPasskey}
                            disabled={loading || passkeyLoading}
                            className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-8 py-3.5 font-semibold text-black transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {passkeyLoading ? <Icon.Spinner size={17} className="animate-spin" /> : <Icon.Key size={17} />}
                            {passkeyLoading ? 'Waiting for passkey…' : 'Sign in with passkey'}
                        </button>
                        <div className="mb-5 flex items-center gap-3 text-xs text-black/35"><span className="h-px flex-1 bg-line" /><span>or use your password</span><span className="h-px flex-1 bg-line" /></div>
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-black/80 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Icon.Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        disabled={loading}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-line-strong rounded-lg text-black placeholder:text-black/40 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-black/80 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Icon.Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-line-strong rounded-lg text-black placeholder:text-black/40 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex justify-end mt-1">
                                    <Link href="/forgot-password" className="text-xs text-black/60 hover:text-black transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-8 py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                {loading && <Icon.Spinner size={16} weight="bold" className="animate-spin" />}
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    )
}
