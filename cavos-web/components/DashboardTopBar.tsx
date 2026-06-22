'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

/**
 * Persistent desktop top bar for the dashboard — functional search on the left,
 * quick actions on the right. Mirrors the app-chrome density of tools like Stripe.
 * Hidden on mobile (the mobile header in the layout handles that breakpoint).
 */

type ResultKind = 'page' | 'app' | 'organization'

interface SearchResult {
    id: string
    label: string
    sublabel?: string
    href: string
    kind: ResultKind
}

const PAGES: SearchResult[] = [
    { id: 'p-overview', label: 'Overview', href: '/dashboard', kind: 'page' },
    { id: 'p-orgs', label: 'Organizations', href: '/dashboard/organizations', kind: 'page' },
    { id: 'p-apps', label: 'Applications', href: '/dashboard/apps', kind: 'page' },
    { id: 'p-paymasters', label: 'Paymasters', href: '/dashboard/paymasters', kind: 'page' },
    { id: 'p-billing', label: 'Billing', href: '/dashboard/billing', kind: 'page' },
]

const KIND_ICON: Record<ResultKind, typeof Icon.Apps> = {
    page: Icon.Overview,
    app: Icon.Apps,
    organization: Icon.Org,
}

const KIND_LABEL: Record<ResultKind, string> = {
    page: 'Page',
    app: 'Application',
    organization: 'Organization',
}

export function DashboardTopBar() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [activeIdx, setActiveIdx] = useState(0)
    const [entities, setEntities] = useState<SearchResult[]>([])
    const [loaded, setLoaded] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Lazily fetch apps + orgs the first time the user engages the search.
    const ensureData = useCallback(async () => {
        if (loaded) return
        setLoaded(true)
        try {
            const [appsRes, orgsRes] = await Promise.all([
                fetch('/api/apps'),
                fetch('/api/organizations'),
            ])
            const next: SearchResult[] = []
            if (appsRes.ok) {
                const { apps = [] } = await appsRes.json()
                for (const a of apps) {
                    next.push({
                        id: `app-${a.id}`,
                        label: a.name,
                        sublabel: a.organization?.name,
                        href: `/dashboard/apps/${a.id}`,
                        kind: 'app',
                    })
                }
            }
            if (orgsRes.ok) {
                const { organizations = [] } = await orgsRes.json()
                for (const o of organizations) {
                    next.push({
                        id: `org-${o.id}`,
                        label: o.name,
                        sublabel: o.slug,
                        href: `/dashboard/organizations/${o.id}`,
                        kind: 'organization',
                    })
                }
            }
            setEntities(next)
        } catch {
            /* search degrades to page-only results */
        }
    }, [loaded])

    const results = useMemo(() => {
        const q = query.trim().toLowerCase()
        const pool = [...PAGES, ...entities]
        if (!q) return PAGES
        return pool
            .filter(
                (r) =>
                    r.label.toLowerCase().includes(q) ||
                    r.sublabel?.toLowerCase().includes(q),
            )
            .slice(0, 8)
    }, [query, entities])

    // Keep the active row in range as results change.
    useEffect(() => {
        setActiveIdx((i) => Math.min(i, Math.max(0, results.length - 1)))
    }, [results.length])

    // Global shortcut: ⌘K / Ctrl+K, or "/" focuses the search.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase()
            const target = e.target as HTMLElement | null
            const typing = target && /^(input|textarea|select)$/i.test(target.tagName)
            if ((e.metaKey || e.ctrlKey) && k === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            } else if (k === '/' && !typing) {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    // Close on outside click.
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    const go = useCallback(
        (r: SearchResult | undefined) => {
            if (!r) return
            setOpen(false)
            setQuery('')
            inputRef.current?.blur()
            router.push(r.href)
        },
        [router],
    )

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActiveIdx((i) => Math.min(i + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIdx((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            go(results[activeIdx])
        } else if (e.key === 'Escape') {
            setOpen(false)
            inputRef.current?.blur()
        }
    }

    return (
        <header className="hidden lg:flex h-16 shrink-0 items-center gap-4 border-b border-line bg-white/80 backdrop-blur-sm px-8 sticky top-0 z-20">
            {/* Search */}
            <div ref={containerRef} className="relative flex-1 max-w-md">
                <div className="group relative">
                    <Icon.Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35 group-focus-within:text-brand transition-colors"
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        placeholder="Search apps, organizations, pages…"
                        onFocus={() => { setOpen(true); ensureData() }}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
                        onKeyDown={onKeyDown}
                        role="combobox"
                        aria-expanded={open}
                        aria-controls="topbar-search-results"
                        className="w-full h-9 pl-9 pr-12 rounded-lg bg-surface border border-line text-sm text-ink placeholder:text-black/35 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 focus:bg-white transition-all"
                    />
                    <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-0.5 font-mono text-[10px] font-medium text-black/35 bg-white border border-line rounded px-1.5 py-0.5 pointer-events-none">
                        ⌘K
                    </kbd>
                </div>

                {open && (
                    <div
                        id="topbar-search-results"
                        role="listbox"
                        className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-line bg-white shadow-lg shadow-black/[0.08] overflow-hidden py-1.5 animate-fadeIn"
                    >
                        {results.length === 0 ? (
                            <p className="px-3 py-6 text-center text-xs text-black/40">
                                No matches for “{query}”
                            </p>
                        ) : (
                            results.map((r, i) => {
                                const ResultIcon = KIND_ICON[r.kind]
                                const active = i === activeIdx
                                return (
                                    <button
                                        key={r.id}
                                        role="option"
                                        aria-selected={active}
                                        onMouseEnter={() => setActiveIdx(i)}
                                        onClick={() => go(r)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                                            active ? 'bg-surface' : ''
                                        }`}
                                    >
                                        <ResultIcon size={16} className="text-black/40 shrink-0" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13px] font-medium text-ink truncate">{r.label}</span>
                                            {r.sublabel && (
                                                <span className="block text-[11px] text-black/40 truncate">{r.sublabel}</span>
                                            )}
                                        </span>
                                        <span className="font-mono text-[10px] uppercase tracking-wide text-black/30 shrink-0">
                                            {KIND_LABEL[r.kind]}
                                        </span>
                                    </button>
                                )
                            })
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1" />

            {/* Quick actions */}
            <div className="flex items-center gap-1">
                <a
                    href="https://docs.cavos.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Documentation"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-black/50 hover:text-ink hover:bg-black/[0.04] transition-colors"
                >
                    <Icon.Docs size={19} />
                </a>
                <button
                    type="button"
                    title="Notifications"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-black/50 hover:text-ink hover:bg-black/[0.04] transition-colors"
                >
                    <Icon.Bell size={19} />
                </button>

                <span className="w-px h-5 bg-line mx-2" />

                <Link
                    href="/dashboard/apps/new"
                    title="New application"
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-hover active:scale-95 transition-all"
                >
                    <Icon.Add size={19} weight="bold" />
                </Link>
            </div>
        </header>
    )
}
