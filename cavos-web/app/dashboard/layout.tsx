'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { DpaConsentModal } from '@/components/DpaConsentModal'
import { DashboardMotion } from '@/components/DashboardMotion'
import { DashboardTopBar } from '@/components/DashboardTopBar'
import { Sheet } from '@/components/ui/Sheet'
import { Icon } from '@/components/ui/Icon'
import { Wordmark } from '@/components/Wordmark'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-white lg:flex">
            <div className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
                <Wordmark />
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    data-pressable
                    aria-expanded={sidebarOpen}
                    className="p-2 text-muted hover:text-ink transition-colors"
                    aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                >
                    {sidebarOpen ? <Icon.Close size={24} weight="bold" /> : <Icon.Menu size={24} weight="bold" />}
                </button>
            </div>

            <div className="hidden w-64 bg-white lg:static lg:block lg:h-screen lg:border-r lg:border-line">
                <Sidebar />
            </div>

            <Sheet
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                side="left"
                size={256}
                label="Dashboard navigation"
                scrimClassName="lg:hidden"
                className="fixed inset-y-0 left-0 z-50 w-64 bg-white touch-pan-y lg:hidden"
            >
                <Sidebar />
            </Sheet>

            <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-white lg:h-screen">
                <DashboardTopBar />
                <main className="relative flex-1 overflow-y-auto px-4 pb-8 pt-[4.5rem] lg:px-8 lg:pb-12 lg:pt-8">
                    <div className="mx-auto max-w-6xl">
                        <DashboardMotion />
                        {children}
                    </div>
                </main>
            </div>

            <DpaConsentModal />
        </div>
    )
}
