'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MegaMenu, type MegaMenuProps } from '@/components/MegaMenu'

const DEVELOPER_MENU: Omit<MegaMenuProps, 'onOpenChange'> = {
    label: 'Developer',
    left: {
        heading: 'Developer',
        items: [
            { title: 'Documentation', description: 'Guides, architecture and the device-signer model.', href: 'https://docs.cavos.xyz' },
            { title: 'API Reference', description: 'Endpoints, authentication and chain configuration.', href: 'https://docs.cavos.xyz' },
            { title: 'SDKs & Libraries', description: 'Install @cavos/kit and start integrating.', href: 'https://docs.cavos.xyz' },
        ],
    },
    right: {
        heading: 'Explore',
        cards: [
            { title: 'Playground', description: 'Try the SDK live in an interactive demo.', href: 'https://demo.cavos.xyz', art: 'playground' },
            { title: 'Dashboard', description: 'Manage apps, API keys and usage.', href: '/dashboard', art: 'dashboard' },
        ],
    },
    footer: { title: 'Start building', description: 'Create an app and get your API key.', ctaLabel: 'Get started', href: 'https://docs.cavos.xyz' },
}

const RESOURCES_MENU: Omit<MegaMenuProps, 'onOpenChange'> = {
    label: 'Resources',
    left: {
        heading: 'Contact',
        items: [
            { title: 'Contact sales', description: 'Talk to us about your integration and pricing.', href: '/contact-sales' },
            { title: 'Email us', description: 'adrianvrj@cavos.xyz', href: 'mailto:adrianvrj@cavos.xyz' },
        ],
    },
    right: {
        heading: 'Company',
        cards: [
            { title: 'About', description: 'Our mission and the team behind Cavos.', art: 'about', disabled: true },
        ],
    },
}

export function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [hidden, setHidden] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [devOpen, setDevOpen] = useState(false)
    const [resOpen, setResOpen] = useState(false)
    const anyMenuOpen = devOpen || resOpen
    const isLanding = pathname === '/'
    // Focused pages (e.g. contact sales) show only the logo + a single account
    // action, so nothing competes with the task in front of the visitor.
    const minimal = pathname === '/contact-sales'
    // No chrome at rest on any page. Hover or scroll brings the solid bar in
    // (Stripe-style); the border only ever appears on those states.
    const transparent = !scrolled && !hovered

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setIsAuthenticated(!!user)
        }
        checkAuth()
    }, [])

    useEffect(() => {
        let lastY = window.scrollY
        const handleScroll = () => {
            const y = window.scrollY
            setScrolled(y > 24)
            // Hide on scroll down, reveal on scroll up. Always shown near the top
            // or while the mobile menu / a hover is active.
            if (isMenuOpen || hovered || y < 120) {
                setHidden(false)
            } else if (y > lastY + 4) {
                setHidden(true)
            } else if (y < lastY - 4) {
                setHidden(false)
            }
            lastY = y
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isMenuOpen, hovered])

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
            <header
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-8 transition-all duration-300 ${
                    hidden && !isMenuOpen ? '-translate-y-full' : 'translate-y-0'
                }`}>
                <div className={`max-w-[1232px] mx-auto my-2 px-4 md:px-5 h-14 flex items-center justify-between gap-6 transition-all duration-300 ${
                    anyMenuOpen ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'
                } ${
                    transparent
                        ? 'bg-transparent'
                        : 'bg-white/95 backdrop-blur-md shadow-sm'
                }`}>

                  <div className="flex items-center gap-10">
                    {/* Logo */}
                    <Link href="/" className="flex items-center shrink-0 hover:opacity-70 transition-opacity">
                        <Image
                            src="/cavos-black.png"
                            alt="Cavos"
                            width={112}
                            height={44}
                            className="h-8 w-auto"
                        />
                    </Link>

                    {/* Desktop nav */}
                    {!minimal && (
                    <nav className="hidden md:flex items-center gap-8">
                        <MegaMenu {...DEVELOPER_MENU} onOpenChange={setDevOpen} />
                        <MegaMenu {...RESOURCES_MENU} onOpenChange={setResOpen} />
                        <Link
                            href="/pricing"
                            className="text-sm font-medium text-ink/60 hover:text-ink transition-colors"
                        >
                            Pricing
                        </Link>
                    </nav>
                    )}
                  </div>

                    {/* Desktop CTA */}
                    <div className="flex items-center gap-2.5">
                        {!isAuthenticated ? (
                            <>
                                <Link
                                    href="/login"
                                    className={`${minimal ? 'inline-flex' : 'hidden md:inline-flex'} items-center px-4 py-2 text-sm font-semibold text-ink bg-white rounded-md border border-line-strong hover:border-ink/40 transition-all`}
                                >
                                    Sign In
                                </Link>
                                {!minimal && (
                                <Link
                                    href="/contact-sales"
                                    className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md bg-brand text-white hover:bg-brand-hover transition-all active:scale-[0.97]"
                                >
                                    Contact Sales
                                </Link>
                                )}
                            </>
                        ) : (
                            <Link
                                href="/dashboard"
                                className={`${minimal ? 'inline-flex' : 'hidden md:inline-flex'} items-center px-4 py-2 text-sm font-semibold rounded-md bg-brand text-white hover:bg-brand-hover transition-all active:scale-[0.97]`}
                            >
                                Dashboard
                            </Link>
                        )}

                        {/* Hamburger */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`${minimal ? 'hidden' : 'md:hidden'} ml-1 w-9 h-9 flex items-center justify-center transition-colors ${transparent ? 'text-white mix-blend-difference' : 'text-ink/70 hover:text-ink'}`}
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
                                <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Pricing</Link>
                                <a href="https://docs.cavos.xyz" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Docs</a>
                                <a href="https://demo.cavos.xyz" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Playground</a>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-3.5 text-lg font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">Sign Out</button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black hover:bg-black/5 rounded-xl transition-colors">Log in</Link>
                                <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Pricing</Link>
                                <a href="https://docs.cavos.xyz" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Docs</a>
                                <a href="https://demo.cavos.xyz" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3.5 text-lg font-medium text-black/50 hover:bg-black/5 rounded-xl transition-colors">Playground</a>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </>
    )
}
