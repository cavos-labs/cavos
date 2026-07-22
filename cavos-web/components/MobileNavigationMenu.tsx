'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { Icon } from '@/components/ui/Icon'

export interface MobileNavigationItem {
  href: string
  label: string
  description?: string
  active?: boolean
}

export function MobileNavigationMenu({ label, items }: { label: string; items: MobileNavigationItem[] }) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const active = items.find((item) => item.active) ?? items[0]

  return (
    <details ref={detailsRef} className="group relative sm:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5 transition-colors marker:content-none hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">{label}</span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-black/80">{active.label}</span>
        </span>
        <Icon.ArrowDown size={14} className="shrink-0 text-black/35 transition-transform duration-150 group-open:rotate-180" />
      </summary>
      <nav aria-label={label} className="mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-lg shadow-black/[0.06]">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            onClick={() => detailsRef.current?.removeAttribute('open')}
            className={`flex items-center gap-3 border-b border-line/70 px-3.5 py-3 transition-colors last:border-0 ${item.active ? 'text-brand' : 'text-black/65 hover:bg-surface hover:text-black'}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 ${item.active ? 'bg-brand' : 'bg-black/15'}`} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{item.label}</span>
              {item.description && <span className="mt-0.5 block text-xs font-normal text-black/40">{item.description}</span>}
            </span>
            {item.active && <Icon.Check size={14} className="shrink-0" />}
          </Link>
        ))}
      </nav>
    </details>
  )
}
