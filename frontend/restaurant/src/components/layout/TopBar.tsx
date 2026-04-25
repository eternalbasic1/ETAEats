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
    <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur-md border-b border-border-subtle">
      <div className="flex items-end justify-between px-6 lg:px-10 pt-7 pb-5">
        <div className="min-w-0">
          <p className="text-label text-text-muted">Console</p>
          <h1 className="mt-1.5 text-h2 lg:text-h1 text-text-primary truncate">{title}</h1>
          {subtitle && <p className="text-body-sm text-text-tertiary mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <SoundToggle enabled={soundEnabled} onToggle={onSoundToggle} />
          <ConnectionBadge state={connectionState} />
        </div>
      </div>
    </header>
  )
}
