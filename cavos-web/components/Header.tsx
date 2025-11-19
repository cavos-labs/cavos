'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Header() {
    const router = useRouter()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setIsAuthenticated(!!user)
        }
        checkAuth()
    }, [])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setIsMenuOpen(false)
        setIsAuthenticated(false)
        router.push('/')
        router.refresh()
    }

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF]/80 backdrop-blur-sm">
                <div className="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                        <Image
                            src="/cavos-black.png"
                            alt="Cavos"
                            width={120}
                            height={48}
                            className="h-10 w-auto"
                        />
                    </Link>

                    <div className="flex items-center gap-6">
                        {/* Dashboard Link (only when authenticated) */}
                        {isAuthenticated && (
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-black hover:opacity-70 transition-opacity hidden md:block"
                            >
                                Dashboard
                            </Link>
                        )}

                        {/* Menu Icon */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity"
                            aria-label="Toggle menu"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Slide-in Menu */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Close Button */}
                    <div className="flex justify-end p-6">
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity"
                            aria-label="Close menu"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 px-8 space-y-6">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block text-2xl font-medium text-black hover:opacity-70 transition-opacity"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/dashboard/organizations"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block text-2xl font-medium text-black hover:opacity-70 transition-opacity"
                                >
                                    Organizations
                                </Link>
                                <Link
                                    href="/dashboard/apps"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block text-2xl font-medium text-black hover:opacity-70 transition-opacity"
                                >
                                    Applications
                                </Link>
                                <Link
                                    href="/docs"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block text-2xl font-medium text-black hover:opacity-70 transition-opacity"
                                >
                                    View Docs
                                </Link>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="block text-2xl font-medium text-red-600 hover:opacity-70 transition-opacity text-left w-full"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block text-2xl font-medium text-black hover:opacity-70 transition-opacity"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block text-2xl font-medium text-black hover:opacity-70 transition-opacity"
                                >
                                    Register
                                </Link>
                                <Link
                                    href="/docs"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block text-2xl font-medium text-black hover:opacity-70 transition-opacity"
                                >
                                    View Docs
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Discord Logo at Bottom */}
                    <div className="p-8">
                        <a
                            href="https://discord.gg/Vvq2ekEV47"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                        >
                            <Image
                                src="/discord-logo.png"
                                alt="Discord"
                                width={32}
                                height={32}
                                className="w-8 h-8"
                            />
                            <span className="text-sm text-black/60">Join our Discord</span>
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}
