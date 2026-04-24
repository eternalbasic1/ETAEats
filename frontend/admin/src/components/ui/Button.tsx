import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed'
    const variants: Record<'primary' | 'secondary' | 'ghost' | 'danger' | 'success', string> = {
      primary:   'bg-primary text-white hover:bg-primary-dark',
      secondary: 'bg-surface border border-border text-text-primary hover:bg-surface2',
      ghost:     'bg-transparent text-text-secondary hover:bg-surface2 hover:text-text-primary',
      danger:    'bg-error-bg text-error border border-error/30 hover:bg-error hover:text-white',
      success:   'bg-success text-white hover:bg-success/90',
    }
    const sizes: Record<'sm' | 'md' | 'lg', string> = {
      sm: 'h-8  px-3 text-xs',
      md: 'h-10 px-4 text-sm',
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
