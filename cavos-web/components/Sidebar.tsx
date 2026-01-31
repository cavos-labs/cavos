'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Building2, AppWindow, LogOut, FileText, CreditCard } from 'lucide-react'
import Image from 'next/image'

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
    { name: 'Applications', href: '/dashboard/apps', icon: AppWindow },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <div className="flex flex-col h-full bg-white border-r border-black/10">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-black/5">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image
                        src="/cavos-black.png"
                        alt="Cavos"
                        width={100}
                        height={40}
                        className="h-8 w-auto"
                    />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive
                                    ? 'bg-black text-white'
                                    : 'text-black/60 hover:text-black hover:bg-black/5'
                                }
              `}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer Links */}
            <div className="p-4 border-t border-black/5 space-y-1">
                <a
                    href="https://docs.cavos.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                >
                    <FileText className="w-4 h-4" />
                    Documentation
                </a>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
