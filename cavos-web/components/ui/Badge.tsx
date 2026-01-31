import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className = '', variant = 'default', children, ...props }, ref) => {
        const variants = {
            default: 'bg-black/5 text-black',
            success: 'bg-green-100 text-green-700',
            warning: 'bg-yellow-100 text-yellow-700',
            error: 'bg-red-100 text-red-700',
            neutral: 'bg-gray-100 text-gray-600'
        };

        return (
            <span
                ref={ref}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
