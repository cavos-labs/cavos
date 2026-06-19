'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Icon } from '@/components/ui/Icon'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to send reset email')
                setLoading(false)
                return
            }

            setSuccess(true)
            setLoading(false)
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
                    <div className="text-center mb-6 md:mb-8">
                        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-2 text-balance">
                            Reset password
                        </h1>
                        <p className="text-black/55 text-sm md:text-base">
                            Enter your email to receive a reset link
                        </p>
                    </div>

                    <div className="bg-white border border-line rounded-2xl p-6 md:p-8 shadow-sm shadow-black/[0.03]">
                        {success ? (
                            <div className="text-center py-4">
                                <div className="w-14 h-14 bg-brand-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Icon.Mail size={26} className="text-brand" />
                                </div>
                                <h3 className="text-lg font-semibold text-black mb-2">Check your email</h3>
                                <p className="text-black/60 mb-6 text-sm">
                                    We've sent a password reset link to <span className="font-medium text-black">{email}</span>.
                                </p>
                                <Link
                                    href="/login"
                                    className="inline-block w-full px-8 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover transition-all text-sm"
                                >
                                    Back to Login
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

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full px-8 py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                    >
                                        {loading && <Icon.Spinner size={16} weight="bold" className="animate-spin" />}
                                        {loading ? 'Sending link...' : 'Send Reset Link'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="inline-flex items-center gap-1.5 text-black/55 text-sm hover:text-black transition-colors">
                            <Icon.ArrowLeft size={15} weight="bold" /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
