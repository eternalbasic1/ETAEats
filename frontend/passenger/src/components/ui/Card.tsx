import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Card({ glow, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-white/8 p-4',
        glow && 'shadow-lg shadow-primary-glow border-primary/30',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
