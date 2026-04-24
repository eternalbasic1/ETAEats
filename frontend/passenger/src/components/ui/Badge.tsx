import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'muted' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'primary', dot, className, children }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-primary-soft text-primary border-primary/30',
    success: 'bg-success-bg text-success border-success/30',
    warning: 'bg-warning-bg text-warning border-warning/30',
    error:   'bg-error-bg text-error border-error/30',
    muted:   'bg-surface2 text-text-secondary border-border',
    info:    'bg-blue-50 text-info border-info/30',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold',
      variants[variant], className,
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full bg-current')} />}
      {children}
    </span>
  )
}
