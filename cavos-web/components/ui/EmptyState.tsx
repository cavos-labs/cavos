import React from 'react'
import { Panel } from './Panel'

interface EmptyStateProps {
    title: string
    description: string
    action?: React.ReactNode
    className?: string
}

/** Dashed panel that teaches the next action. Not a brand-flooded hero. */
export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
    return (
        <Panel className={`border-dashed px-6 py-10 text-center ${className}`}>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted text-pretty">{description}</p>
            {action && <div className="mt-5 flex justify-center">{action}</div>}
        </Panel>
    )
}
