'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/Icon'
import { Wordmark } from '@/components/Wordmark'
import { Popover } from '@/components/ui/Popover'
import { useEffect, useState } from 'react'
import { useOrganization } from '@/lib/hooks/useOrganization'
import { useApp } from '@/lib/hooks/useApp'

const appNav = [
    { name: 'Overview', suffix: '', icon: Icon.Overview },
    { name: 'Wallets', suffix: '/wallets', icon: Icon.Wallet },
    { name: 'Activity', suffix: '/activity', icon: Icon.Activity },
    { name: 'Emails', suffix: '/emails', icon: Icon.Mail },
    { name: 'Programs', suffix: '/programs', icon: Icon.Code },
    { name: 'Environments', suffix: '/environments', icon: Icon.Connect },
    { name: 'Settings', suffix: '/settings', icon: Icon.Settings },
]

const profileLinks = [
    { name: 'Settings', href: '/dashboard/settings', icon: Icon.Settings },
    { name: 'Team', href: '/dashboard/team', icon: Icon.Org },
    { name: 'API keys', href: '/dashboard/api-keys', icon: Icon.Key },
]

function railLinkClass(active: boolean) {
    return `
        flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150
        ${active
            ? 'bg-surface font-semibold text-ink'
            : 'font-medium text-muted hover:bg-black/[0.03] hover:text-ink'
        }
    `
}

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const { organizations, organizationId, setOrganizationId, loading: organizationsLoading } = useOrganization()
    const { apps, app, appId, setAppId, loading: appsLoading } = useApp()

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

    const openApp = (id: string) => {
        setAppId(id)
        router.push(`/dashboard/apps/${id}`)
    }

    useEffect(() => {
        if (appsLoading || !appId) return
        const match = pathname.match(/^\/dashboard\/apps\/([^/]+)/)
        const currentId = match?.[1]
        if (!currentId || currentId === 'new') return
        if (!apps.some((item) => item.id === currentId)) {
            router.replace(`/dashboard/apps/${appId}`)
        }
    }, [appId, apps, appsLoading, pathname, router])

    return (
        <div className="flex h-full flex-col bg-white text-ink">
            <div className="px-3 pt-4 pb-3">
                <Popover
                    label="Application"
                    triggerClassName="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/[0.03]"
                    panelClassName="left-0 right-0 mt-1 max-h-[min(32rem,70vh)] w-[calc(16rem-1.5rem)] overflow-y-auto rounded-xl border border-line bg-white py-2"
                    trigger={(open) => (
                        <>
                            <AppMark name={app?.name} logoUrl={app?.logo_url} />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">
                                    {appsLoading ? 'Loading…' : app?.name ?? 'Select an app'}
                                </span>
                                <span className="block truncate text-[11px] text-muted">
                                    {organizations.find((organization) => organization.id === organizationId)?.name ?? 'Organization'}
                                </span>
                            </span>
                            <Icon.ArrowDown
                                size={13}
                                className={`shrink-0 text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                            />
                        </>
                    )}
                >
                    {(close) => (
                        <>
                            <div className="px-3 pb-2">
                                <label className="block">
                                    <span className="mb-1.5 block text-[11px] font-medium text-muted">Organization</span>
                                    <select
                                        aria-label="Current organization"
                                        value={organizationId}
                                        onChange={(event) => setOrganizationId(event.target.value)}
                                        disabled={organizationsLoading || organizations.length === 0}
                                        className="h-9 w-full appearance-none truncate rounded-lg border border-line-strong bg-surface px-2.5 pr-7 text-xs font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
                                    >
                                        {organizations.map((organization) => (
                                            <option key={organization.id} value={organization.id}>
                                                {organization.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <p className="px-3 pb-1 text-[11px] font-medium text-muted">Applications</p>
                            {apps.length === 0 && !appsLoading && (
                                <p className="px-3 py-2 text-xs text-muted">No applications yet.</p>
                            )}
                            {apps.map((item) => (
                                <button
                                    key={item.id}
                                    role="menuitem"
                                    onClick={() => { close(); openApp(item.id) }}
                                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${item.id === appId ? 'bg-surface font-semibold text-ink' : 'text-ink hover:bg-black/[0.03]'}`}
                                >
                                    <AppMark name={item.name} logoUrl={item.logo_url} size="sm" />
                                    <span className="min-w-0 truncate">{item.name}</span>
                                    {item.id === appId && <Icon.Check size={13} className="ml-auto shrink-0 text-muted" />}
                                </button>
                            ))}
                            <Link
                                href={`/dashboard/apps/new${organizationId ? `?organization_id=${organizationId}` : ''}`}
                                role="menuitem"
                                onClick={close}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink hover:bg-black/[0.03]"
                            >
                                <Icon.Add size={15} />
                                New application
                            </Link>
                            <Link
                                href="/dashboard/apps"
                                role="menuitem"
                                onClick={close}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink hover:bg-black/[0.03]"
                            >
                                <Icon.Apps size={15} />
                                All applications
                            </Link>

                            <div className="my-2 border-t border-line" />
                            <Link
                                href="/dashboard/organizations"
                                role="menuitem"
                                onClick={close}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink hover:bg-black/[0.03]"
                            >
                                <Icon.Org size={15} className="shrink-0 text-muted" />
                                Manage organizations
                            </Link>
                        </>
                    )}
                </Popover>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-2">
                {appId ? appNav.map((item) => {
                    const href = `/dashboard/apps/${appId}${item.suffix}`
                    const isActive = item.suffix
                        ? pathname.startsWith(href)
                        : pathname === `/dashboard/apps/${appId}`

                    return (
                        <Link
                            key={item.name}
                            href={href}
                            aria-current={isActive ? 'page' : undefined}
                            className={railLinkClass(isActive)}
                        >
                            <item.icon size={16} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
                            {item.name}
                        </Link>
                    )
                }) : (
                    <p className="px-2.5 py-6 text-xs leading-5 text-muted">
                        Create an application to see its overview, wallets, and configuration.
                    </p>
                )}
            </nav>

            <div className="mt-auto px-3 pb-1">
                <Link
                    href="/dashboard/billing"
                    aria-current={pathname.startsWith('/dashboard/billing') ? 'page' : undefined}
                    className={railLinkClass(pathname.startsWith('/dashboard/billing'))}
                >
                    <Icon.Billing size={16} weight={pathname.startsWith('/dashboard/billing') ? 'fill' : 'regular'} className="shrink-0" />
                    Billing
                </Link>
            </div>

            <div className="border-t border-line px-3 py-3">
                <div className="mb-2 flex items-center justify-between px-1">
                    <Wordmark className="h-5 w-5" />
                    <a
                        href="https://docs.cavos.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
                    >
                        Docs
                        <Icon.External size={11} className="opacity-50" />
                    </a>
                </div>
                <Popover
                    label="Account"
                    placement="top"
                    triggerClassName="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/[0.03]"
                    panelClassName="left-0 right-0 w-full rounded-xl border border-line bg-white py-2"
                    trigger={() => (
                        <>
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-[11px] font-semibold text-ink">
                                {(userEmail?.[0] ?? '?').toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                                {userEmail ?? 'Account'}
                            </span>
                        </>
                    )}
                >
                    {(close) => (
                        <>
                            {profileLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    role="menuitem"
                                    onClick={close}
                                    className={`flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-black/[0.03] ${pathname.startsWith(item.href) ? 'font-semibold text-ink' : 'text-ink'}`}
                                >
                                    <item.icon size={15} className="shrink-0 text-muted" />
                                    {item.name}
                                </Link>
                            ))}
                            <div className="my-1 border-t border-line" />
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => { close(); handleLogout() }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink hover:bg-black/[0.03]"
                            >
                                <Icon.Logout size={15} className="shrink-0 text-muted" />
                                Sign out
                            </button>
                        </>
                    )}
                </Popover>
            </div>
        </div>
    )
}

function AppMark({ name, logoUrl, size = 'md' }: { name?: string; logoUrl?: string | null; size?: 'sm' | 'md' }) {
    const box = size === 'sm' ? 'h-6 w-6 rounded-md' : 'h-8 w-8 rounded-lg'
    const glyph = size === 'sm' ? 12 : 15
    return (
        <span className={`relative shrink-0 overflow-hidden border border-line bg-surface ${box}`}>
            {logoUrl ? (
                <Image src={logoUrl} alt="" fill className="object-cover" />
            ) : (
                <span className="flex h-full w-full items-center justify-center text-muted">
                    {name ? <span className="text-[10px] font-bold">{name[0]?.toUpperCase()}</span> : <Icon.Apps size={glyph} />}
                </span>
            )}
        </span>
    )
}
