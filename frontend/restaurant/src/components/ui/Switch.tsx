'use client'
import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md'
}

export function Switch({ checked, onChange, disabled, className, size = 'md' }: SwitchProps) {
  const dim = size === 'sm'
    ? { track: 'h-5 w-9', thumb: 'h-4 w-4', off: 'translate-x-0.5', on: 'translate-x-[18px]' }
    : { track: 'h-6 w-11', thumb: 'h-5 w-5', off: 'translate-x-0.5', on: 'translate-x-[22px]' }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-base ease-standard',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-strong',
        dim.track,
        checked ? 'bg-primary' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white shadow-e1 transition-transform duration-base ease-standard',
          dim.thumb,
          checked ? dim.on : dim.off,
        )}
      />
    </button>
  )
}
