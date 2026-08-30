import React from 'react'

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
    padded?: boolean
}

/** Standard console surface: panel token, hairline, 8px radius, no shadow. */
export function Panel({ className = '', padded = true, children, ...props }: PanelProps) {
    return (
        <div
            data-dash-panel
            className={`rounded-xl border border-line bg-panel ${padded ? 'p-5' : ''} ${className}`}
            {...props}
        >
            {children}
        </div>
    )
}
