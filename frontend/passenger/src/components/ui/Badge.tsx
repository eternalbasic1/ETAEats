import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'primary', dot, className, children }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-primary/15 text-primary-soft border-primary/30',
    success: 'bg-success/15 text-success border-success/30',
    error:   'bg-error/15 text-error border-error/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    muted:   'bg-surface2 text-text-secondary border-white/8',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
      variants[variant], className,
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full bg-current')} />}
      {children}
    </span>
  )
}
