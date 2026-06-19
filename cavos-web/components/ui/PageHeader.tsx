import React from 'react'

interface PageHeaderProps {
    /** Small uppercase eyebrow above the title. */
    eyebrow?: string
    title: React.ReactNode
    /** Sub-line under the title (email, description, count). */
    subtitle?: React.ReactNode
    /** Right-aligned actions (buttons, links). */
    actions?: React.ReactNode
    className?: string
}

/**
 * Standard dashboard page header: eyebrow + title + subtitle on the left,
 * actions on the right. Tagged with `data-dash-header` so DashboardMotion
 * plays its entrance automatically.
 */
export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
    return (
        <div data-dash-header className={`flex items-end justify-between gap-4 ${className}`}>
            <div className="min-w-0">
                <h1 className="text-2xl md:text-[28px] font-bold tracking-[-0.025em] text-ink text-balance leading-none">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-black/50 mt-2 font-medium truncate">{subtitle}</p>
                )}
            </div>
            {actions && <div className="hidden sm:flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
    )
}
