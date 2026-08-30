import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'ok' | 'warn' | 'danger' | 'neutral' | 'success' | 'warning' | 'error'
}

const tones: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'text-ink',
    ok: 'text-muted',
    success: 'text-muted',
    warn: 'text-warn',
    warning: 'text-warn',
    danger: 'text-danger',
    error: 'text-danger',
    neutral: 'text-muted',
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className = '', variant = 'default', children, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={`text-sm font-medium capitalize ${tones[variant]} ${className}`}
                {...props}
            >
                {children}
            </span>
        )
    }
)

Badge.displayName = 'Badge'
