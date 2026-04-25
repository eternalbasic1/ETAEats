'use client'
import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SoundToggleProps {
  enabled: boolean
  onToggle: () => void
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-2 h-9 px-3.5 rounded-pill border text-[12px] font-semibold tracking-[0.02em]',
        'transition-all duration-base ease-standard',
        enabled
          ? 'bg-accent-muted-mint text-accent-ink-muted-mint border-transparent'
          : 'bg-surface text-text-tertiary border-border hover:border-border-strong',
      )}
      title={enabled ? 'Sound alerts on' : 'Sound alerts off'}
    >
      {enabled ? <Volume2 className="h-3.5 w-3.5" strokeWidth={1.9} /> : <VolumeX className="h-3.5 w-3.5" strokeWidth={1.9} />}
      {enabled ? 'Sound on' : 'Sound off'}
    </button>
  )
}
