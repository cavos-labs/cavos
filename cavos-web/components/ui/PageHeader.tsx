import React from 'react'

interface PageHeaderProps {
    /** Sentence-case kicker above the title. One per page, not per section. */
    eyebrow?: string
    title: React.ReactNode
    /** Sub-line under the title (email, description, count). */
    subtitle?: React.ReactNode
    /** Right-aligned actions (buttons, links). */
    actions?: React.ReactNode
    className?: string
}

/**
 * Standard dashboard page header: eyebrow + display title + subtitle on the left,
 * actions on the right. Tagged with `data-dash-header` so DashboardMotion
 * plays its entrance automatically.
 */
export function PageHeader({ eyebrow, title, subtitle, actions, className = '' }: PageHeaderProps) {
    return (
        <div data-dash-header className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
            <div className="min-w-0">
                {eyebrow && (
                    <p className="mb-2 text-[11px] font-medium text-muted">{eyebrow}</p>
                )}
                <h1 className="text-2xl md:text-[28px] font-semibold tracking-[-0.03em] text-ink text-balance leading-tight">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-muted mt-2 font-medium text-pretty max-w-2xl">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
    )
}
