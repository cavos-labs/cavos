'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/Icon'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const navigation = [
    { name: 'Overview',      href: '/dashboard',               icon: Icon.Overview },
    { name: 'Organizations', href: '/dashboard/organizations', icon: Icon.Org },
    { name: 'Applications',  href: '/dashboard/apps',          icon: Icon.Apps },
    { name: 'Billing',       href: '/dashboard/billing',       icon: Icon.Billing },
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
        <div className="flex flex-col h-full bg-white border-r border-line">

            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-line">
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
                            aria-current={isActive ? 'page' : undefined}
                            className={`
                                group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 active:scale-[0.98]
                                ${isActive
                                    ? 'text-brand font-semibold bg-black/[0.04]'
                                    : 'text-black/60 font-medium hover:text-black hover:bg-black/[0.035]'
                                }
                            `}
                        >
                            <item.icon
                                size={19}
                                weight={isActive ? 'fill' : 'regular'}
                                className={`shrink-0 transition-colors ${isActive ? 'text-brand' : 'text-black/55 group-hover:text-black'}`}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-line space-y-0.5">
                <Link
                    href="/dashboard/how-to-start"
                    className={`
                        flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all
                        ${pathname === '/dashboard/how-to-start'
                            ? 'text-brand font-semibold'
                            : 'text-black/45 hover:text-black hover:bg-black/[0.03]'
                        }
                    `}
                >
                    <Icon.Spark size={17} className="shrink-0 text-black/40" />
                    How to start
                </Link>

                <a
                    href="https://docs.cavos.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-black/45 hover:text-black hover:bg-black/[0.03] rounded-lg transition-all"
                >
                    <Icon.Docs size={17} className="shrink-0 text-black/40" />
                    Documentation
                    <Icon.External size={13} weight="bold" className="ml-auto text-black/25" />
                </a>

                {/* User info */}
                {userEmail && (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-black/[0.06] flex items-center justify-center text-xs font-bold text-black/55 shrink-0 select-none">
                            {userEmail[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-black/50 truncate min-w-0">{userEmail}</span>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500/70 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all"
                >
                    <Icon.Logout size={17} className="shrink-0" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
