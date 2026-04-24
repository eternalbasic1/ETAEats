import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed'
    const variants: Record<'primary' | 'secondary' | 'ghost' | 'danger' | 'success', string> = {
      primary:   'bg-primary text-surface shadow-e1 hover:-translate-y-0.5 hover:shadow-cta',
      secondary: 'bg-surface2 border border-border text-text-primary hover:bg-gray-200',
      ghost:     'bg-transparent text-text-secondary hover:bg-surface2 hover:text-text-primary',
      danger:    'bg-error-bg text-error border border-error hover:bg-error hover:text-surface',
      success:   'bg-success-bg text-success border border-success hover:bg-success hover:text-surface',
    }
    const sizes: Record<'sm' | 'md' | 'lg', string> = {
      sm: 'h-8  px-3 text-xs',
      md: 'h-11 px-5 text-[15px]',
      lg: 'h-12 px-6 text-base',
    }
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
