'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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

            // Redirect to dashboard
            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            setError('An unexpected error occurred')
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#FFFFFF]">
            <Header />

            <div className="pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 flex items-center justify-center min-h-screen">
                <div className="w-full max-w-md">
                    {/* Title */}
                    <div className="text-center mb-6 md:mb-8">
                        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-2">
                            Welcome back
                        </h1>
                        <p className="text-black/60 text-sm md:text-base">
                            Sign in to your account
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8 shadow-sm">
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
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-white border border-black/20 rounded-lg text-black placeholder:text-black/40 focus:outline-none focus:border-black/50 transition-colors disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-black/80 mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-white border border-black/20 rounded-lg text-black placeholder:text-black/40 focus:outline-none focus:border-black/50 transition-colors disabled:opacity-50"
                                />
                                <div className="flex justify-end mt-1">
                                    <Link href="/forgot-password" className="text-xs text-black/60 hover:text-black transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-8 py-3.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-black/60 text-sm">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-black font-medium hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
