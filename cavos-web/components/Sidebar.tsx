'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Building2, AppWindow, LogOut, FileText, CreditCard, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const navigation = [
    { name: 'Overview',      href: '/dashboard',               icon: LayoutDashboard },
    { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
    { name: 'Applications',  href: '/dashboard/apps',          icon: AppWindow },
    { name: 'Billing',       href: '/dashboard/billing',       icon: CreditCard },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUserEmail(user?.email ?? null)
        }
        getUser()
    }, [])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <div className="flex flex-col h-full bg-[#F7F5F2] border-r border-[#EAE5DC]">

            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-[#EAE5DC]/70">
                <Link href="/dashboard" className="hover:opacity-75 transition-opacity">
                    <Image
                        src="/cavos-black.png"
                        alt="Cavos"
                        width={96}
                        height={38}
                        className="h-7 w-auto"
                    />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {navigation.map((item) => {
                    const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                                ${isActive
                                    ? 'bg-white text-black shadow-sm border border-[#EAE5DC] shadow-black/[0.04]'
                                    : 'text-black/45 hover:text-black hover:bg-white/60'
                                }
                            `}
                        >
                            <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-black/35'}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-[#EAE5DC]/70 space-y-0.5">
                <a
                    href="https://docs.cavos.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-black/40 hover:text-black hover:bg-white/60 rounded-xl transition-all"
                >
                    <FileText className="w-4 h-4 shrink-0" />
                    Documentation
                    <ExternalLink className="w-3 h-3 ml-auto text-black/25" />
                </a>

                {/* User info */}
                {userEmail && (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-[#EAE5DC] flex items-center justify-center text-xs font-bold text-black/50 shrink-0 select-none">
                            {userEmail[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-black/50 truncate min-w-0">{userEmail}</span>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500/70 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
