'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink } from 'lucide-react'

export function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const isLanding = pathname === '/'
    const transparent = isLanding && !scrolled

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setIsAuthenticated(!!user)
        }
        checkAuth()
    }, [])

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 24)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
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
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                transparent
                    ? 'bg-transparent'
                    : 'bg-white/85 backdrop-blur-md border-b border-line'
            }`}>
                <div className="max-w-[1280px] mx-auto px-6 md:px-8 h-[4.5rem] flex items-center justify-between gap-6">

                  <div className="flex items-center gap-10">
                    {/* Logo */}
                    <Link href="/" className="flex items-center shrink-0 hover:opacity-70 transition-opacity">
                        <Image
                            src="/cavos-black.png"
                            alt="Cavos"
                            width={112}
                            height={44}
                            className="h-9 w-auto"
                        />
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink transition-colors"
                        >
                            Docs
                            <ExternalLink className="w-3 h-3" />
                        </a>
                        <Link
                            href="/blog"
                            className="text-sm font-medium text-ink/60 hover:text-ink transition-colors"
                        >
                            Changelog
                        </Link>
                        <a
                            href="https://discord.gg/Vvq2ekEV47"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-ink/60 hover:text-ink transition-colors"
                        >
                            Discord
                        </a>
                        {isAuthenticated && (
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-ink/60 hover:text-ink transition-colors"
                            >
                                Dashboard
                            </Link>
                        )}
                    </nav>
                  </div>

                    {/* Desktop CTA */}
                    <div className="flex items-center gap-2.5">
                        {!isAuthenticated ? (
                            <>
                                <Link
                                    href="/login"
                                    className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold text-ink bg-white rounded-md border border-line-strong hover:border-ink/40 transition-all"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="mailto:hello@cavos.xyz"
                                    className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md bg-brand text-white hover:bg-brand-hover transition-all active:scale-[0.97]"
                                >
                                    Contact Us
                                </Link>
                            </>
                        ) : (
                            <Link
                                href="/dashboard"
                                className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md bg-brand text-white hover:bg-brand-hover transition-all active:scale-[0.97]"
                            >
                                Dashboard
                            </Link>
                        )}

                        {/* Hamburger */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`md:hidden ml-1 w-9 h-9 flex items-center justify-center transition-colors ${transparent ? 'text-white mix-blend-difference' : 'text-ink/70 hover:text-ink'}`}
                            aria-label="Toggle menu"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                {isMenuOpen
                                    ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                                    : <><line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="21" y2="16" /></>
                                }
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Mobile slide-in menu — full screen */}
            <div className={`fixed inset-0 h-full w-full bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
                isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 h-[4.5rem] border-b border-black/[0.06]">
                        <Image src="/cavos-black.png" alt="Cavos" width={90} height={36} className="h-8 w-auto" />
                        <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center text-black/50 hover:text-black transition-colors" aria-label="Close menu">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-0.5">
                        {isAuthenticated ? (
                            <>
                                {[
                                    { label: 'Dashboard', href: '/dashboard' },
                                    { label: 'Organizations', href: '/dashboard/organizations' },
                                    { label: 'Applications', href: '/dashboard/apps' },
                                ].map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block px-4 py-3.5 text-lg font-medium text-black hover:bg-black/5 rounded-xl transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <a href="https://docs.cavos.xyz" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Docs</a>
                                <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Changelog</Link>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-3.5 text-lg font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">Sign Out</button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black hover:bg-black/5 rounded-xl transition-colors">Log in</Link>
                                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black hover:bg-black/5 rounded-xl transition-colors">Start building</Link>
                                <a href="https://docs.cavos.xyz" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Docs</a>
                                <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Changelog</Link>
                                <a href="https://discord.gg/Vvq2ekEV47" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Discord</a>
                            </>
                        )}
                    </nav>

                    <div className="px-6 py-5 border-t border-black/[0.06]">
                        <a href="https://discord.gg/Vvq2ekEV47" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs text-black/40 hover:text-black/70 transition-colors">
                            <Image src="/discord-logo.png" alt="Discord" width={20} height={20} className="w-5 h-5" />
                            Join our Discord
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}
