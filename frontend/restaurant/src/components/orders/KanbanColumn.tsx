import { AnimatePresence } from 'framer-motion'
import { OrderCard } from './OrderCard'
import type { Order, OrderStatus } from '@/lib/api.types'

interface KanbanColumnProps {
  title: string
  count: number
  accent: 'primary' | 'warning' | 'success'
  orders: Order[]
  newOrderIds: Set<string>
  onAdvance: (orderId: string, next: OrderStatus) => Promise<void> | void
  onCancel: (orderId: string, reason: string) => Promise<void> | void
}

const HEADER_COLORS: Record<'primary' | 'warning' | 'success', string> = {
  primary: 'text-primary',
  warning: 'text-warning',
  success: 'text-success',
}

export function KanbanColumn({ title, count, accent, orders, newOrderIds, onAdvance, onCancel }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col bg-surface2 rounded-md">
      <div className="h-11 flex items-center gap-2 px-4 border-b border-border">
        <h2 className={`text-xs font-bold uppercase tracking-wider ${HEADER_COLORS[accent]}`}>{title}</h2>
        <span className="text-xs font-bold text-text-muted bg-surface rounded-full px-2 py-0.5 border border-border">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
          <p className="text-xs text-text-muted text-center py-6">No orders here.</p>
        )}
      </div>
    </div>
  )
}
