'use client'
import { Badge } from '@/components/ui'

interface TopBarProps {
  title: string
  userPhone?: string
}

export function TopBar({ title, userPhone }: TopBarProps) {
  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6">
      <div>
        <h1 className="text-base font-bold text-text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="primary">ADMIN</Badge>
        {userPhone && <span className="text-xs text-text-secondary">{userPhone}</span>}
      </div>
    </header>
  )
}
