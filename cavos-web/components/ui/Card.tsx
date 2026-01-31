import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white border border-black/10 rounded-xl shadow-sm ${!noPadding ? 'p-6' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
