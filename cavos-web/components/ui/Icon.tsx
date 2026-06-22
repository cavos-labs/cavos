'use client'

import React from 'react'
import type { Icon as PhosphorIcon, IconProps, IconWeight } from '@phosphor-icons/react'
import {
    SquaresFour,
    Buildings,
    AppWindow,
    CreditCard,
    Pulse,
    Plus,
    ArrowRight,
    ArrowLeft,
    ArrowDown,
    CaretRight,
    CaretLeft,
    Lightning,
    GasPump,
    FileText,
    Sparkle,
    SignOut,
    ArrowSquareOut,
    Envelope,
    Key,
    Lock,
    ShieldCheck,
    DeviceMobile,
    Wallet,
    Copy,
    Check,
    CheckCircle,
    WarningCircle,
    Clock,
    Eye,
    PencilSimple,
    Trash,
    ArrowCounterClockwise,
    UploadSimple,
    MagnifyingGlass,
    List,
    X,
    CircleNotch,
    Plugs,
    TrendDown,
    Image as ImageIcon,
    BookOpen,
    Bell,
    GearSix,
    Question,
    Code,
} from '@phosphor-icons/react'

/**
 * Central icon system for the Cavos app.
 *
 * Wraps Phosphor Icons with a brand-consistent default: duotone weight,
 * 18px size, currentColor. Duotone renders a background path at 0.2 opacity
 * plus a full-color foreground — so an active icon set to `text-brand` reads
 * as a brand-tinted fill behind a brand stroke (the reference look). Neutral
 * icons (e.g. `text-ink/65`) get a soft tinted fill for free.
 *
 * Call sites use semantic names (`<Icon.Apps />`, `<Icon.Org />`) so swapping
 * the underlying glyph happens in one place.
 */

const DEFAULT_WEIGHT: IconWeight = 'regular'
const DEFAULT_SIZE = 18

function wrap(Glyph: PhosphorIcon) {
    const Wrapped = React.forwardRef<SVGSVGElement, IconProps>(
        ({ weight, size, ...props }, ref) => (
            <Glyph
                ref={ref}
                weight={weight ?? DEFAULT_WEIGHT}
                size={size ?? DEFAULT_SIZE}
                {...props}
            />
        )
    )
    Wrapped.displayName = `Icon(${Glyph.displayName ?? 'Phosphor'})`
    return Wrapped
}

export const Icon = {
    // Navigation / nouns
    Overview: wrap(SquaresFour),
    Org: wrap(Buildings),
    Apps: wrap(AppWindow),
    Billing: wrap(CreditCard),
    Activity: wrap(Pulse),
    Wallet: wrap(Wallet),
    Gas: wrap(GasPump),
    Docs: wrap(BookOpen),
    File: wrap(FileText),
    Image: wrap(ImageIcon),
    Connect: wrap(Plugs),
    Device: wrap(DeviceMobile),
    Mail: wrap(Envelope),
    Key: wrap(Key),
    Lock: wrap(Lock),
    Shield: wrap(ShieldCheck),

    // Actions
    Add: wrap(Plus),
    Copy: wrap(Copy),
    Edit: wrap(PencilSimple),
    Delete: wrap(Trash),
    Upload: wrap(UploadSimple),
    Refresh: wrap(ArrowCounterClockwise),
    Search: wrap(MagnifyingGlass),
    Logout: wrap(SignOut),
    External: wrap(ArrowSquareOut),
    Eye: wrap(Eye),
    Menu: wrap(List),
    Close: wrap(X),

    // Arrows / chevrons
    ArrowRight: wrap(ArrowRight),
    ArrowLeft: wrap(ArrowLeft),
    ArrowDown: wrap(ArrowDown),
    ChevronRight: wrap(CaretRight),
    ChevronLeft: wrap(CaretLeft),

    // Status / accents
    Spark: wrap(Sparkle),
    Bolt: wrap(Lightning),
    Check: wrap(Check),
    CheckCircle: wrap(CheckCircle),
    Warning: wrap(WarningCircle),
    Clock: wrap(Clock),
    TrendDown: wrap(TrendDown),
    Spinner: wrap(CircleNotch),
    Bell: wrap(Bell),
    Settings: wrap(GearSix),
    Help: wrap(Question),
    Code: wrap(Code),
} as const

export type IconName = keyof typeof Icon

/* ── IconChip ───────────────────────────────────────────────
   The framed icon container used across the dashboard. Consistent
   surface, border, and hover→brand treatment in one place. */

interface IconChipProps {
    children: React.ReactNode
    /** Tailwind size for the container. */
    size?: 'sm' | 'md' | 'lg'
    /** Apply the brand hover treatment (use inside a `group`). */
    interactive?: boolean
    className?: string
}

const chipSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-lg',
    lg: 'w-11 h-11 rounded-xl',
}

export function IconChip({ children, size = 'md', interactive = false, className = '' }: IconChipProps) {
    return (
        <div
            className={`flex items-center justify-center shrink-0 bg-black/[0.035] text-ink/70 transition-colors duration-150
                ${chipSizes[size]}
                ${interactive ? 'group-hover:bg-black/[0.07] group-hover:text-ink' : ''}
                ${className}`}
        >
            {children}
        </div>
    )
}
