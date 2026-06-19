'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { DpaConsentModal } from '@/components/DpaConsentModal'
import { DashboardMotion } from '@/components/DashboardMotion'
import { DashboardTopBar } from '@/components/DashboardTopBar'
import { Icon } from '@/components/ui/Icon'
import Image from 'next/image'
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
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-black/10 z-40 flex items-center justify-between px-4">
                <Link href="/dashboard">
                    <Image
                        src="/cavos-black.png"
                        alt="Cavos"
                        width={100}
                        height={40}
                        className="h-8 w-auto"
                    />
                </Link>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-black/60 hover:text-black transition-colors"
                    aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                >
                    {sidebarOpen ? <Icon.Close size={24} weight="bold" /> : <Icon.Menu size={24} weight="bold" />}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:border-r border-black/10
        ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
      `}>
                <Sidebar />
            </div>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:h-screen overflow-hidden bg-surface/40">
                <DashboardTopBar />
                <main className="flex-1 overflow-y-auto pt-20 lg:pt-8 p-4 lg:px-8 lg:pb-12">
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
