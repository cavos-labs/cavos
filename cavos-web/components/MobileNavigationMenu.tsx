'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { Popover } from '@/components/ui/Popover'

export interface MobileNavigationItem {
  href: string
  label: string
  description?: string
  active?: boolean
}

/**
 * Section switcher for narrow viewports.
 *
 * Previously a native `<details>`, which can't be animated, interrupted, or
 * dismissed with Escape, and whose open/close was a hard cut. Now a Popover:
 * the panel grows out of the control that opened it and leaves the same way.
 */
export function MobileNavigationMenu({ label, items }: { label: string; items: MobileNavigationItem[] }) {
  const active = items.find((item) => item.active) ?? items[0]

  return (
    <div className="sm:hidden">
      <Popover
        label={label}
        align="start"
        triggerClassName="flex w-full min-h-12 items-center gap-3 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-left transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25"
        panelClassName="w-full mt-2 overflow-hidden rounded-xl border border-line bg-panel"
        trigger={(open) => (
          <>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-ink">{active.label}</span>
            </span>
            <Icon.ArrowDown
              size={14}
              className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      >
        {(close) => (
          <nav aria-label={label}>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={item.active ? 'page' : undefined}
                onClick={close}
                className={`flex items-center gap-3 border-b border-line/70 px-3.5 py-3 transition-colors last:border-0 ${item.active ? 'bg-surface text-ink' : 'text-muted hover:bg-black/[0.03] hover:text-ink'}`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 ${item.active ? 'bg-ink' : 'bg-white/15'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  {item.description && <span className="mt-0.5 block text-xs font-normal text-muted">{item.description}</span>}
                </span>
                {item.active && <Icon.Check size={14} className="shrink-0" />}
              </Link>
            ))}
          </nav>
        )}
      </Popover>
    </div>
  )
}
