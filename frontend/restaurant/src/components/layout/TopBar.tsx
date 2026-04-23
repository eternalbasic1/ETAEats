'use client'
import { ConnectionBadge } from './ConnectionBadge'
import { SoundToggle } from './SoundToggle'
import type { ConnectionState } from '@/hooks/useRestaurantSocket'

interface TopBarProps {
  title: string
  subtitle?: string
  connectionState: ConnectionState
  soundEnabled: boolean
  onSoundToggle: () => void
}

export function TopBar({ title, subtitle, connectionState, soundEnabled, onSoundToggle }: TopBarProps) {
  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6">
      <div>
        <h1 className="text-base font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <SoundToggle enabled={soundEnabled} onToggle={onSoundToggle} />
        <ConnectionBadge state={connectionState} />
      </div>
    </header>
  )
}
