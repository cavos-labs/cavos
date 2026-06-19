import React from 'react';
import { Icon } from './Icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-brand text-white hover:bg-brand-hover active:scale-95',
      secondary: 'bg-black/[0.05] text-ink hover:bg-black/[0.08] active:scale-95',
      ghost: 'bg-transparent text-muted hover:text-ink hover:bg-black/5',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
      outline: 'border border-line-strong text-ink hover:border-ink/40 hover:bg-black/5 active:scale-95'
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Icon.Spinner size={16} weight="bold" className="mr-2 animate-spin" />}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
