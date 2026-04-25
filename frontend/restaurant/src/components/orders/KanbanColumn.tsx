import { AnimatePresence } from 'framer-motion'
import { OrderCard } from './OrderCard'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/api.types'

export type ColumnAccent = 'powder' | 'cream' | 'mint'

interface KanbanColumnProps {
  title: string
  count: number
  accent: ColumnAccent
  orders: Order[]
  newOrderIds: Set<string>
  onAdvance: (orderId: string, next: OrderStatus) => Promise<void> | void
  onCancel: (orderId: string, reason: string) => Promise<void> | void
}

const HEADER_DOT: Record<ColumnAccent, string> = {
  powder: 'bg-accent-powder-blue text-accent-ink-powder-blue',
  cream:  'bg-accent-soft-cream text-accent-ink-soft-cream',
  mint:   'bg-accent-muted-mint text-accent-ink-muted-mint',
}

const COLUMN_BG: Record<ColumnAccent, string> = {
  powder: 'bg-surface',
  cream:  'bg-surface',
  mint:   'bg-surface',
}

export function KanbanColumn({ title, count, accent, orders, newOrderIds, onAdvance, onCancel }: KanbanColumnProps) {
  return (
    <div className={cn('flex-1 min-w-0 flex flex-col rounded-card border border-border shadow-e1 overflow-hidden', COLUMN_BG[accent])}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full', HEADER_DOT[accent])}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          <p className="text-label text-text-muted">{title}</p>
        </div>
        <span className="text-h4 text-text-primary tabular-nums">{count}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-bg/40">
        <AnimatePresence initial={false}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              accent={accent}
              isNew={newOrderIds.has(order.id)}
              onAdvance={onAdvance}
              onCancel={onCancel}
            />
          ))}
        </AnimatePresence>
        {orders.length === 0 && (
          <div className="flex items-center justify-center py-12 text-body-sm text-text-muted">
            Quiet for now.
          </div>
        )}
      </div>
    </div>
  )
}
