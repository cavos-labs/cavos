import { ButtonHTMLAttributes, forwardRef } from 'react'
import { romagothicbold } from '@/lib/fonts'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', isLoading, className = '', disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-[#EAE5DC]/30
      disabled:opacity-50 disabled:cursor-not-allowed
      ${romagothicbold.className}
    `

    const variants = {
      primary: `
        bg-[#EAE5DC] text-[#000000]
        hover:bg-white hover:shadow-[0_8px_40px_rgba(234,229,220,0.15)]
        active:scale-[0.98]
      `,
      ghost: `
        text-[#EAE5DC]/80 hover:text-[#EAE5DC]
        border border-[#EAE5DC]/20 hover:border-[#EAE5DC]/40
        hover:bg-[#EAE5DC]/5
        active:scale-[0.98]
      `,
      danger: `
        bg-red-500 text-white
        hover:bg-red-600
        active:scale-[0.98]
      `,
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-[15px]',
      lg: 'px-8 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
