import { Card } from '@/components/ui'

interface StatTileProps {
  label: string
  value: string
  delta?: string
  accent?: 'primary' | 'success' | 'warning' | 'error'
}

export function StatTile({ label, value, delta, accent = 'primary' }: StatTileProps) {
  const accentColor = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    error:   'text-error',
  }[accent]

  return (
    <Card>
      <p className="text-xs font-semibold text-text-secondary uppercase">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accentColor}`}>{value}</p>
      {delta && <p className="text-xs text-text-muted mt-1">{delta}</p>}
    </Card>
  )
}
