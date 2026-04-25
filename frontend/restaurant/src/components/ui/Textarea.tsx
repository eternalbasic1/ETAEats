import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[96px] w-full rounded-lg border border-border bg-surface px-4 py-3 text-body text-text-primary',
        'placeholder:text-text-muted resize-y',
        'transition-colors duration-base ease-standard',
        'focus:border-border-strong focus:outline-none focus:ring-0',
        className,
      )}
      {...props}
    />
  )
})
