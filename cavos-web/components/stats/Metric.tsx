import type { ReactNode } from 'react'

interface MetricProps {
    label: string
    value: string
    note?: string
}

export function Metric({ label, value, note }: MetricProps) {
    return (
        <div className="bg-white px-6 py-7">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-4 font-mono text-3xl font-semibold tabular-nums text-ink">{value}</p>
            {note ? <p className="mt-2 text-xs text-muted">{note}</p> : null}
        </div>
    )
}

interface MetricGridProps {
    children: ReactNode
    columns?: 2 | 3 | 4
}

const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
}

/**
 * Hairline gridlines drawn by a `gap-px` fill rather than per-cell borders, so
 * the rules stay one pixel at every breakpoint. Same trick as CaseStudies.
 */
export function MetricGrid({ children, columns = 4 }: MetricGridProps) {
    return (
        <div
            data-reveal
            data-reveal-group
            className={`grid gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line ${COLUMN_CLASS[columns]}`}
        >
            {children}
        </div>
    )
}

