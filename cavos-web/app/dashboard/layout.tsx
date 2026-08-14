'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { DpaConsentModal } from '@/components/DpaConsentModal'
import { DashboardMotion } from '@/components/DashboardMotion'
import { DashboardTopBar } from '@/components/DashboardTopBar'
import { Sheet } from '@/components/ui/Sheet'
import { Icon } from '@/components/ui/Icon'
import Link from 'next/link'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[#FFFFFF] lg:flex">
            {/* Mobile Header */}
            <div className="material-chrome lg:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4">
                <Link href="/dashboard" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30">
                    <span
                        role="img"
                        aria-label="Cavos"
                        className="block h-7 w-7 bg-brand"
                        style={{ WebkitMask: 'url(/cavos-black.png) center / contain no-repeat', mask: 'url(/cavos-black.png) center / contain no-repeat' }}
                    />
                </Link>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    data-pressable
                    aria-expanded={sidebarOpen}
                    className="p-2 text-black/60 hover:text-black transition-colors"
                    aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                >
                    {sidebarOpen ? <Icon.Close size={24} weight="bold" /> : <Icon.Menu size={24} weight="bold" />}
                </button>
            </div>

            {/* Desktop sidebar — permanent, no transition to interrupt */}
            <div className="hidden lg:block lg:static lg:h-screen w-64 bg-white lg:border-r border-black/10">
                <Sidebar />
            </div>

            {/* Mobile sidebar — grab it, drag it, flick it away */}
            <Sheet
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                side="left"
                size={256}
                label="Dashboard navigation"
                scrimClassName="lg:hidden"
                className="material-sheet fixed inset-y-0 left-0 z-50 w-64 touch-pan-y lg:hidden"
            >
                <Sidebar />
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:h-screen overflow-hidden bg-surface/40">
                <DashboardTopBar />
                <main className="flex-1 overflow-y-auto px-4 pb-8 pt-[4.5rem] lg:px-8 lg:pb-12 lg:pt-8">
                    <div className="max-w-6xl mx-auto">
                        <DashboardMotion />
                        {children}
                    </div>
                </main>
            </div>

            <DpaConsentModal />
        </div>
    )
}
