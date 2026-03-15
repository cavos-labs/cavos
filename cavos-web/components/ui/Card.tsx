import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  variant?: 'default' | 'accent' | 'featured' | 'dark';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', noPadding = false, variant = 'default', children, ...props }, ref) => {
    const variants: Record<string, string> = {
      default:  'bg-white border border-black/[0.08] rounded-2xl shadow-sm',
      accent:   'bg-[#F7F5F2] border border-[#EAE5DC] rounded-2xl',
      featured: 'bg-white border border-[#EAE5DC] rounded-2xl shadow-md shadow-black/5',
      dark:     'bg-[#0A0908] border border-white/[0.08] rounded-2xl text-white',
    };

    return (
      <div
        ref={ref}
        className={`${variants[variant]} ${!noPadding ? 'p-6' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
