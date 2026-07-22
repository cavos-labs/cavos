'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MobileNavigationMenu } from '@/components/MobileNavigationMenu'

const tabs = [
  ['Overview', ''], ['Wallets', '/wallets'], ['Devices & recovery', '/devices'], ['Activity', '/activity'],
  ['Sponsorship', '/sponsorship'], ['Authentication', '/authentication'], ['Emails', '/emails'],
  ['Programs', '/programs'], ['Environments', '/environments'], ['Settings', '/settings'],
] as const

export function AppNavigation({ appId }: { appId: string }) {
  const pathname = usePathname()
  const base = `/dashboard/apps/${appId}`
  const mobileItems = tabs.map(([label, suffix]) => { const href = `${base}${suffix}`; return { label, href, active: suffix ? pathname.startsWith(href) : pathname === base } })
  return <>
    <MobileNavigationMenu label="Application" items={mobileItems} />
    <nav aria-label="Application sections" className="hidden overflow-x-auto border-b border-line sm:block"><div className="flex min-w-max gap-5">
    {tabs.map(([label, suffix]) => { const href = `${base}${suffix}`; const active = suffix ? pathname.startsWith(href) : pathname === base; return <Link key={label} href={href} aria-current={active ? 'page' : undefined} className={`border-b-2 px-0.5 py-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${active ? 'border-brand text-ink' : 'border-transparent text-black/45 hover:text-black'}`}>{label}</Link> })}
    </div></nav>
  </>
}
