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
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
        enabled
          ? 'bg-success-bg text-success border border-success/30'
          : 'bg-surface2 text-text-secondary border border-border',
      )}
      title={enabled ? 'Sound alerts on' : 'Sound alerts off'}
    >
      {enabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      {enabled ? 'Sound on' : 'Sound off'}
    </button>
  )
}
