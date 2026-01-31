import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', icon, error, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-black/80 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-white border rounded-lg px-4 py-2 text-sm transition-all
              focus:outline-none focus:ring-2 focus:ring-black/5
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-black/10 focus:border-black/30'
              }
              ${className}
            `}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
