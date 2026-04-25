import { cn } from '@/lib/utils'

export function Spinner({ className, tone = 'primary' }: { className?: string; tone?: 'primary' | 'light' }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border-2 animate-spin',
        tone === 'primary'
          ? 'border-gray-300 border-t-primary'
          : 'border-white/30 border-t-white',
        className ?? 'h-5 w-5',
      )}
    />
  )
}
