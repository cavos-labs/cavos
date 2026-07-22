'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Icon } from '@/components/ui/Icon'

export default function RegisterPage() {
    const router = useRouter()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [dpaAccepted, setDpaAccepted] = useState(false)
    const [nextPath, setNextPath] = useState('/dashboard')

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

        // Client-side validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            setLoading(false)
            return
        }

        if (!dpaAccepted) {
            setError('You must accept the Terms of Service and Data Processing Agreement to continue')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: fullName, dpa_accepted: true, next: nextPath }),
            })

            const data = await res.json()

            if (!res.ok) {
                console.error('Registration failed:', data)
                setError(data.error || 'Registration failed')
                setLoading(false)
                return
            }

            if (data.session) {
                router.push(nextPath)
                router.refresh()
                return
            }

            setSuccess(true)
        } catch (err) {
            setError('An unexpected error occurred')
            setLoading(false)
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
                            Create account
                        </h1>
                        <p className="text-black/55 text-sm md:text-base">
                            Start building with Cavos
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white border border-line rounded-2xl p-6 md:p-8 shadow-sm shadow-black/[0.03]">
                        {success ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-brand-soft rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Icon.Mail size={30} className="text-brand" />
                                </div>
                                <h3 className="text-xl font-semibold text-black mb-2">Check your email</h3>
                                <p className="text-black/60 mb-6">
                                    We've sent a confirmation link to <span className="font-medium text-black">{email}</span>. Please verify your email to continue.
                                </p>
                                <Link
                                    href={`/login?${new URLSearchParams({ email, next: nextPath }).toString()}`}
                                    className="inline-block w-full px-8 py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover transition-all"
                                >
                                    Go to Login
                                </Link>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="fullName" className="block text-sm font-medium text-black/80 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            id="fullName"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            disabled={loading}
                                            className="w-full px-4 py-3 bg-white border border-line-strong rounded-lg text-black placeholder:text-black/40 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all disabled:opacity-50"
                                        />
                                    </div>

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
                                        <p className="text-xs text-black/50 mt-1">
                                            Must be at least 8 characters
                                        </p>
                                    </div>

                                    {/* DPA + ToS acceptance */}
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={dpaAccepted}
                                            onChange={(e) => setDpaAccepted(e.target.checked)}
                                            disabled={loading}
                                            className="mt-0.5 w-4 h-4 rounded border-black/30 accent-brand shrink-0 cursor-pointer"
                                        />
                                        <span className="text-xs text-black/50 leading-relaxed group-hover:text-black/70 transition-colors">
                                            I agree to the{' '}
                                            <Link href="/dpa" target="_blank" className="text-brand underline underline-offset-2 hover:opacity-80">
                                                Data Processing Agreement
                                            </Link>
                                            {' '}and{' '}
                                            <Link href="/privacy" target="_blank" className="text-brand underline underline-offset-2 hover:opacity-80">
                                                Privacy Policy
                                            </Link>
                                            . I understand that Cavos acts as a Data Processor for my users&apos; data.
                                        </span>
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={loading || !dpaAccepted}
                                        className="w-full px-8 py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                    >
                                        {loading && <Icon.Spinner size={16} weight="bold" className="animate-spin" />}
                                        {loading ? 'Creating account...' : 'Create Account'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-black/60 text-sm">
                            Already have an account?{' '}
                            <Link href={`/login?${new URLSearchParams({ email, next: nextPath }).toString()}`} className="text-brand font-semibold hover:underline underline-offset-2">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
