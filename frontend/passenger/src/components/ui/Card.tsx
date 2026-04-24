import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'primary' | 'warning' | 'success' | 'error' | 'none'
}

export function Card({ accent = 'none', className, children, ...props }: CardProps) {
  const accents: Record<'primary' | 'warning' | 'success' | 'error' | 'none', string> = {
    primary: 'border-l-[3px] border-l-primary',
    warning: 'border-l-[3px] border-l-warning',
    success: 'border-l-[3px] border-l-success',
    error:   'border-l-[3px] border-l-error',
    none:    '',
  }
  return (
    <div
      className={cn(
        'rounded-card bg-surface border border-border shadow-e1 p-4',
        accents[accent],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
