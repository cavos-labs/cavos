'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

/**
 * Persistent desktop top bar for the dashboard — search on the left, quick
 * actions on the right. Mirrors the app-chrome density of tools like Stripe.
 * Hidden on mobile (the mobile header in the layout handles that breakpoint).
 */
export function DashboardTopBar() {
    return (
        <header className="hidden lg:flex h-16 shrink-0 items-center gap-4 border-b border-line bg-white/80 backdrop-blur-sm px-8 sticky top-0 z-20">
            {/* Search */}
            <label className="group relative flex-1 max-w-md">
                <Icon.Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35 group-focus-within:text-brand transition-colors"
                />
                <input
                    type="search"
                    placeholder="Search apps, wallets, organizations…"
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface border border-line text-sm text-ink placeholder:text-black/35 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 focus:bg-white transition-all"
                />
            </label>

            <div className="flex-1" />

            {/* Quick actions */}
            <div className="flex items-center gap-1">
                <a
                    href="https://docs.cavos.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Documentation"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-black/50 hover:text-ink hover:bg-black/[0.04] transition-colors"
                >
                    <Icon.Docs size={19} />
                </a>
                <Link
                    href="/dashboard/how-to-start"
                    title="Get help"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-black/50 hover:text-ink hover:bg-black/[0.04] transition-colors"
                >
                    <Icon.Help size={19} />
                </Link>
                <button
                    type="button"
                    title="Notifications"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-black/50 hover:text-ink hover:bg-black/[0.04] transition-colors"
                >
                    <Icon.Bell size={19} />
                </button>

                <span className="w-px h-5 bg-line mx-2" />

                <Link
                    href="/dashboard/apps/new"
                    title="New application"
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-hover active:scale-95 transition-all"
                >
                    <Icon.Add size={19} weight="bold" />
                </Link>
            </div>
        </header>
    )
}
