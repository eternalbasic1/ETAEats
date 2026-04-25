'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  active?: boolean
  children: React.ReactNode
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      data-active={active ? 'true' : 'false'}
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-pill border px-4 text-[13px] font-semibold',
        'transition-all duration-base ease-standard whitespace-nowrap flex-shrink-0',
        active
          ? 'bg-primary text-text-on-dark border-primary shadow-e1'
          : 'bg-surface text-text-secondary border-border hover:bg-surface2 hover:border-border-strong',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
