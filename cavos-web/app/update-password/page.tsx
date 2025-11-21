'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'

export default function UpdatePasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to update password')
                setLoading(false)
                return
            }

            setSuccess(true)
            setLoading(false)

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
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
                    <div className="text-center mb-6 md:mb-8">
                        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-2">
                            Set new password
                        </h1>
                        <p className="text-black/60 text-sm md:text-base">
                            Enter your new password below
                        </p>
                    </div>

                    <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8 shadow-sm">
                        {success ? (
                            <div className="text-center py-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-black mb-2">Password updated!</h3>
                                <p className="text-black/60 mb-6 text-sm">
                                    Your password has been changed successfully. Redirecting to dashboard...
                                </p>
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
                                        <label htmlFor="password" className="block text-sm font-medium text-black/80 mb-2">
                                            New Password
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
                                        <p className="text-xs text-black/50 mt-1">
                                            Must be at least 8 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-black/80 mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            disabled={loading}
                                            className="w-full px-4 py-3 bg-white border border-black/20 rounded-lg text-black placeholder:text-black/40 focus:outline-none focus:border-black/50 transition-colors disabled:opacity-50"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full px-8 py-3.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
