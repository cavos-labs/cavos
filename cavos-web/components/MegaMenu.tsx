'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/**
 * Full-width header mega-menu.
 *
 * A trigger opens a panel that spans the header bar exactly (the open bar
 * carries a backdrop-filter, so it becomes the containing block for this fixed
 * element — left-0/right-0 and top-14 line the panel up flush, full width). The
 * layout is asymmetric, Privy-style: a text list on the left, a hairline
 * divider, and framed feature cards with isometric art on the right. An
 * optional quiet footer closes it off.
 *
 * Everything is driven by config so the same component powers "Developer",
 * "Resources", etc. `onOpenChange` lets the header flatten the bar's bottom
 * corners while a menu is open.
 */

export type Art = 'playground' | 'dashboard' | 'about'

export interface MegaLink {
    title: string
    description: string
    href: string
}

export interface MegaCard {
    title: string
    description: string
    href?: string
    art: Art
    /** Disabled cards render inert with a "Coming soon" note. */
    disabled?: boolean
}

export interface MegaMenuProps {
    label: string
    left: { heading: string; items: MegaLink[] }
    right: { heading: string; cards: MegaCard[] }
    footer?: { title: string; description: string; ctaLabel: string; href: string }
    onNavigate?: () => void
    onOpenChange?: (open: boolean) => void
}

const isHttp = (href: string) => /^https?:/.test(href)
const isMailto = (href: string) => href.startsWith('mailto:')
const isAnchor = (href: string) => isHttp(href) || isMailto(href)

// Shared isometric floor grid, centred on the origin, faded at the edges so the
// object appears to sit in space.
const ISO_GRID = [
    '-6.93,-36 62.37,4', '-20.79,-28 48.51,12', '-34.65,-20 34.65,20', '-48.51,-12 20.79,28', '-62.37,-4 6.93,36',
    '6.93,-36 -62.37,4', '20.79,-28 -48.51,12', '34.65,-20 -34.65,20', '48.51,-12 -20.79,28', '62.37,-4 -6.93,36',
]

const IsoGrid = ({ cx, cy, mask }: { cx: number; cy: number; mask: string }) => (
    <g transform={`translate(${cx},${cy})`} stroke="#402AFF" strokeOpacity="0.16" strokeWidth="1" mask={mask}>
        {ISO_GRID.map((p) => {
            const [a, b] = p.split(' ')
            const [x1, y1] = a.split(',')
            const [x2, y2] = b.split(',')
            return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}
    </g>
)

/**
 * Isometric illustrations for the feature cards — the Cavos take on Privy's 3D
 * art. Volumes are built from three shaded indigo faces (light top / brand
 * right / deep left) so they read dimensional, sitting on a faded iso grid with
 * a soft cast shadow. Brand indigo only: no pastel.
 */
const ILLUSTRATIONS: Record<Art, React.ReactNode> = {
    // A floating cube (the SDK) with a play glyph on its face.
    playground: (
        <svg viewBox="0 0 240 128" fill="none" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
                <linearGradient id="pgTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8878FF" /><stop offset="1" stopColor="#6250FF" /></linearGradient>
                <linearGradient id="pgRight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4B36FF" /><stop offset="1" stopColor="#3A24E6" /></linearGradient>
                <linearGradient id="pgLeft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E1FA6" /><stop offset="1" stopColor="#241682" /></linearGradient>
                <radialGradient id="pgFade" cx="50%" cy="50%" r="55%"><stop offset="0" stopColor="#fff" /><stop offset="0.65" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
                <mask id="pgMask"><rect width="240" height="128" fill="url(#pgFade)" /></mask>
                <filter id="pgBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4.5" /></filter>
            </defs>
            <g transform="translate(120 61) scale(1.5) translate(-120 -61)">
                <ellipse cx="120" cy="99" rx="42" ry="10" fill="#402AFF" opacity="0.14" filter="url(#pgBlur)" />
                <IsoGrid cx={120} cy={90} mask="url(#pgMask)" />
                <polygon points="93,46 120,61.5 120,91.5 93,76" fill="url(#pgLeft)" />
                <polygon points="147,46 120,61.5 120,91.5 147,76" fill="url(#pgRight)" />
                <polygon points="120,30.5 147,46 120,61.5 93,46" fill="url(#pgTop)" />
                <polyline points="120,30.5 147,46 120,61.5 93,46 120,30.5" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />
                <path d="M129,61 L129,79 L143,70 Z" fill="#fff" fillOpacity="0.95" />
            </g>
        </svg>
    ),
    // A rising isometric bar chart (usage / analytics).
    dashboard: (
        <svg viewBox="0 0 240 128" fill="none" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
                <linearGradient id="dbTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8878FF" /><stop offset="1" stopColor="#6250FF" /></linearGradient>
                <linearGradient id="dbRight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4B36FF" /><stop offset="1" stopColor="#3A24E6" /></linearGradient>
                <linearGradient id="dbLeft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E1FA6" /><stop offset="1" stopColor="#241682" /></linearGradient>
                <radialGradient id="dbFade" cx="50%" cy="50%" r="55%"><stop offset="0" stopColor="#fff" /><stop offset="0.65" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
                <mask id="dbMask"><rect width="240" height="128" fill="url(#dbFade)" /></mask>
                <filter id="dbBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4.5" /></filter>
            </defs>
            <g transform="translate(112 79) scale(1.5) translate(-112 -79)">
                <ellipse cx="112" cy="112" rx="48" ry="10" fill="#402AFF" opacity="0.14" filter="url(#dbBlur)" />
                <IsoGrid cx={112} cy={96} mask="url(#dbMask)" />
                <polygon points="84.14,64 98,72 98,92 84.14,84" fill="url(#dbLeft)" />
                <polygon points="111.86,64 98,72 98,92 111.86,84" fill="url(#dbRight)" />
                <polygon points="98,56 111.86,64 98,72 84.14,64" fill="url(#dbTop)" />
                <polygon points="98,62 111.86,70 111.86,100 98,92" fill="url(#dbLeft)" />
                <polygon points="125.72,62 111.86,70 111.86,100 125.72,92" fill="url(#dbRight)" />
                <polygon points="111.86,54 125.72,62 111.86,70 98,62" fill="url(#dbTop)" />
                <polygon points="111.86,58 125.72,66 125.72,108 111.86,100" fill="url(#dbLeft)" />
                <polygon points="139.58,58 125.72,66 125.72,108 139.58,100" fill="url(#dbRight)" />
                <polygon points="125.72,50 139.58,58 125.72,66 111.86,58" fill="url(#dbTop)" />
                <polyline points="125.72,50 139.58,58 125.72,66 111.86,58 125.72,50" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />
            </g>
        </svg>
    ),
    // An isometric building (the company) with lit windows.
    about: (
        <svg viewBox="0 0 240 128" fill="none" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
                <linearGradient id="abTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8878FF" /><stop offset="1" stopColor="#6250FF" /></linearGradient>
                <linearGradient id="abRight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4B36FF" /><stop offset="1" stopColor="#3A24E6" /></linearGradient>
                <linearGradient id="abLeft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E1FA6" /><stop offset="1" stopColor="#241682" /></linearGradient>
                <radialGradient id="abFade" cx="50%" cy="50%" r="55%"><stop offset="0" stopColor="#fff" /><stop offset="0.65" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
                <mask id="abMask"><rect width="240" height="128" fill="url(#abFade)" /></mask>
                <filter id="abBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4.5" /></filter>
            </defs>
            <g transform="translate(120 70) scale(1.42) translate(-120 -70)">
                <ellipse cx="120" cy="118" rx="40" ry="9" fill="#402AFF" opacity="0.14" filter="url(#abBlur)" />
                <IsoGrid cx={120} cy={104} mask="url(#abMask)" />
                {/* building volume */}
                <polygon points="96,42 120,56 120,112 96,98" fill="url(#abLeft)" />
                <polygon points="144,42 120,56 120,112 144,98" fill="url(#abRight)" />
                <polygon points="120,28 144,42 120,56 96,42" fill="url(#abTop)" />
                <polyline points="120,28 144,42 120,56 96,42 120,28" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />
                {/* rooftop unit */}
                <polygon points="120,40 130,45.8 120,51.6 110,45.8" fill="#fff" fillOpacity="0.14" />
                {/* windows on the brand (right) face */}
                <g transform="matrix(-24 14 0 56 144 42)" fill="#fff" fillOpacity="0.82">
                    <rect x="0.16" y="0.14" width="0.2" height="0.13" />
                    <rect x="0.52" y="0.14" width="0.2" height="0.13" />
                    <rect x="0.16" y="0.42" width="0.2" height="0.13" />
                    <rect x="0.52" y="0.42" width="0.2" height="0.13" />
                    <rect x="0.16" y="0.7" width="0.2" height="0.13" />
                    <rect x="0.52" y="0.7" width="0.2" height="0.13" />
                </g>
                {/* windows on the deep (left) face */}
                <g transform="matrix(24 14 0 56 96 42)" fill="#fff" fillOpacity="0.5">
                    <rect x="0.28" y="0.14" width="0.2" height="0.13" />
                    <rect x="0.64" y="0.14" width="0.2" height="0.13" />
                    <rect x="0.28" y="0.42" width="0.2" height="0.13" />
                    <rect x="0.64" y="0.42" width="0.2" height="0.13" />
                    <rect x="0.28" y="0.7" width="0.2" height="0.13" />
                    <rect x="0.64" y="0.7" width="0.2" height="0.13" />
                </g>
            </g>
        </svg>
    ),
}

const PANEL_VARIANTS = {
    hidden: { opacity: 0, y: -8, scale: 0.985 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -6, scale: 0.99 },
}

const EASE = [0.16, 1, 0.3, 1] as const

export function MegaMenu({ label, left, right, footer, onNavigate, onOpenChange }: MegaMenuProps) {
    const [open, setOpen] = useState(false)
    const reduce = useReducedMotion()
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Let the header flatten the bar's bottom corners while the menu is open so
    // the panel merges into it with no rounded "notches".
    useEffect(() => { onOpenChange?.(open) }, [open, onOpenChange])

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    }

    const scheduleClose = () => {
        cancelClose()
        closeTimer.current = setTimeout(() => setOpen(false), 120)
    }

    useEffect(() => () => cancelClose(), [])

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false)
    }

    const focusProps = {
        onFocus: () => { cancelClose(); setOpen(true) },
        onClick: () => { setOpen(false); onNavigate?.() },
    }

    // Render an internal Link, an external/new-tab anchor, or a plain anchor
    // (mailto) depending on the href shape.
    const asLink = (href: string, className: string, children: React.ReactNode) => {
        if (isHttp(href)) {
            return <a href={href} target="_blank" rel="noopener noreferrer" {...focusProps} className={className}>{children}</a>
        }
        if (isMailto(href)) {
            return <a href={href} {...focusProps} className={className}>{children}</a>
        }
        return <Link href={href} {...focusProps} className={className}>{children}</Link>
    }

    const Heading = ({ children, delay }: { children: string; delay: number }) => (
        <motion.p
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay, ease: EASE }}
            className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/35"
        >
            {children}
        </motion.p>
    )

    const renderRow = (item: MegaLink, index: number) => {
        const cls = 'group block py-2.5 outline-none'
        const inner = (
            <>
                <span className="block text-[13.5px] font-medium text-ink transition-colors group-hover:text-brand">
                    {item.title}
                </span>
                <span className="block text-[12.5px] leading-snug text-ink/50 mt-0.5">
                    {item.description}
                </span>
            </>
        )
        return (
            <motion.div
                key={item.title}
                initial={reduce ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.06 + index * 0.04, ease: EASE }}
            >
                {asLink(item.href, cls, inner)}
            </motion.div>
        )
    }

    const hoverGlow = (
        <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: 'radial-gradient(circle, rgba(64,42,255,0.20), transparent 70%)' }}
        />
    )

    // Privy-style feature tile: a flat illustration panel (light surface, no
    // border, no shadow, no rounded floating card) with the label below it.
    // `tall` makes a single tile span the whole featured column.
    const renderTile = (item: MegaCard, index: number, tall: boolean) => {
        const disabled = item.disabled || !item.href
        const wrapCls = disabled ? 'group block cursor-default' : 'group block outline-none'
        const inner = (
            <>
                <div className={`relative ${tall ? 'h-[212px]' : 'h-[168px]'} overflow-hidden rounded-lg bg-surface transition-colors duration-200 ${disabled ? '' : 'group-hover:bg-[#EFEEF6]'}`}>
                    {hoverGlow}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        whileHover={reduce || disabled ? undefined : { scale: 1.04 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    >
                        {ILLUSTRATIONS[item.art]}
                    </motion.div>
                </div>
                <div className="pt-3">
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-ink transition-colors group-hover:text-brand">
                        {item.title}
                        {disabled && <span className="text-[11px] font-medium text-ink/40">Coming soon</span>}
                    </span>
                    <span className="block text-[12.5px] leading-snug text-ink/55 mt-1 max-w-[46ch]">
                        {item.description}
                    </span>
                </div>
            </>
        )
        return (
            <motion.div
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.12 + index * 0.06, ease: EASE }}
            >
                {disabled ? <div className={wrapCls} aria-disabled>{inner}</div> : asLink(item.href!, wrapCls, inner)}
            </motion.div>
        )
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => { cancelClose(); setOpen(true) }}
            onMouseLeave={scheduleClose}
            onKeyDown={handleKey}
        >
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                onFocus={() => { cancelClose(); setOpen(true) }}
                aria-expanded={open}
                aria-haspopup="true"
                className="flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink transition-colors outline-none"
            >
                {label}
                <motion.svg
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </button>

            {/* Full-width panel — see note above about the bar being the
                containing block (backdrop-filter). */}
            <AnimatePresence>
                {open && (
                    <div
                        className="fixed left-0 right-0 top-14 z-40 pointer-events-none"
                        onMouseEnter={() => { cancelClose(); setOpen(true) }}
                        onMouseLeave={scheduleClose}
                    >
                        <motion.div
                            variants={PANEL_VARIANTS}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE }}
                            className="max-w-[1232px] mx-auto pointer-events-auto rounded-b-md border border-line border-t-0 bg-white shadow-[0_20px_50px_-20px_rgba(10,10,15,0.22),0_2px_10px_-6px_rgba(10,10,15,0.1)] overflow-hidden origin-top"
                        >
                            <div className="flex divide-x divide-line">
                                {/* Left — text list (natural, narrow column) */}
                                <div className="w-[300px] shrink-0 px-5 py-6">
                                    <Heading delay={0.05}>{left.heading}</Heading>
                                    <div className="space-y-0.5">
                                        {left.items.map((it, i) => renderRow(it, i))}
                                    </div>
                                </div>

                                {/* Right — featured region fills the rest */}
                                <div className="min-w-0 flex-1 px-6 py-6">
                                    <Heading delay={0.09}>{right.heading}</Heading>
                                    {right.cards.length === 1 ? (
                                        renderTile(right.cards[0], 0, true)
                                    ) : (
                                        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${right.cards.length}, minmax(0, 1fr))` }}>
                                            {right.cards.map((it, i) => renderTile(it, i, false))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {footer && (
                                <motion.div
                                    initial={reduce ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 0.2, ease: EASE }}
                                >
                                    {asLink(
                                        footer.href,
                                        'group flex items-center justify-between gap-3 px-6 py-4 border-t border-line transition-colors hover:bg-ink/[0.02] outline-none',
                                        <>
                                            <span className="flex flex-col">
                                                <span className="text-[13.5px] font-semibold text-ink transition-colors group-hover:text-brand">
                                                    {footer.title}
                                                </span>
                                                <span className="text-[12.5px] text-ink/50">
                                                    {footer.description}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink/45 transition-colors group-hover:text-brand">
                                                {footer.ctaLabel}
                                                <motion.svg
                                                    whileHover={reduce ? undefined : { x: 3 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                >
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </motion.svg>
                                            </span>
                                        </>,
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
