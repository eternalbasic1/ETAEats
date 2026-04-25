import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

type StatAccent = 'powder' | 'cream' | 'peach' | 'mint' | 'neutral'

interface StatTileProps {
  label: string
  value: string
  delta?: string
  accent?: StatAccent
}

const TILE_TONE: Record<StatAccent, { card: 'powder' | 'elevated' | 'peach' | 'mint' | 'default'; ink: string }> = {
  powder:  { card: 'powder',   ink: 'text-accent-ink-powder-blue' },
  cream:   { card: 'elevated', ink: 'text-accent-ink-soft-cream'  },
  peach:   { card: 'peach',    ink: 'text-accent-ink-peach'       },
  mint:    { card: 'mint',     ink: 'text-accent-ink-muted-mint'  },
  neutral: { card: 'default',  ink: 'text-text-tertiary' },
}

export function StatTile({ label, value, delta, accent = 'powder' }: StatTileProps) {
  const tone = TILE_TONE[accent]
  return (
    <Card tone={tone.card} padding="lg" radius="card" bordered={tone.card === 'default'} shadow="e1">
      <p className={cn('text-label', tone.ink)}>{label}</p>
      <p className="mt-3 text-display-l text-text-primary tabular-nums tracking-[-0.03em]">{value}</p>
      {delta && <p className={cn('mt-2 text-body-sm', tone.ink, 'opacity-80')}>{delta}</p>}
    </Card>
  )
}
