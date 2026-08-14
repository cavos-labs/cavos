import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
  /** Shown under the field. State is never carried by colour alone. */
  errorMessage?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', icon, error, errorMessage, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const invalid = error || !!errorMessage;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-black/80 mb-1.5">
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
            id={inputId}
            aria-invalid={invalid || undefined}
            aria-describedby={errorMessage ? errorId : undefined}
            className={`
              w-full bg-white border rounded-lg px-4 py-2 text-sm
              transition-[border-color,box-shadow,opacity] duration-150
              focus:outline-none focus:ring-2 focus:ring-black/5
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${invalid
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-black/10 focus:border-black/30'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {errorMessage && (
          <p id={errorId} className="mt-1.5 text-xs text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
