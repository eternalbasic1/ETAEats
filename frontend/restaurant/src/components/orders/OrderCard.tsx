'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical, Bus } from 'lucide-react'
import { Button, Card, IconButton } from '@/components/ui'
import { CancelOrderDialog } from './CancelOrderDialog'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/api.types'

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus; variant: 'primary' | 'success' }>> = {
  PENDING:   { label: 'Confirm',       next: 'CONFIRMED', variant: 'primary' },
  CONFIRMED: { label: 'Start cooking', next: 'PREPARING', variant: 'primary' },
  PREPARING: { label: 'Mark ready',    next: 'READY',     variant: 'primary' },
  READY:     { label: 'Picked up',     next: 'PICKED_UP', variant: 'primary' },
}

interface OrderCardProps {
  order: Order
  isNew?: boolean
  accent: 'powder' | 'cream' | 'mint'
  onAdvance: (orderId: string, next: OrderStatus) => Promise<void> | void
  onCancel: (orderId: string, reason: string) => Promise<void> | void
}

const ACCENT_RING: Record<'powder' | 'cream' | 'mint', string> = {
  powder: 'ring-accent-powder-blue',
  cream:  'ring-accent-soft-cream',
  mint:   'ring-accent-muted-mint',
}

export function OrderCard({ order, isNew, accent, onAdvance, onCancel }: OrderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const action = NEXT_ACTION[order.status]
  const shortId = order.id.slice(0, 8)

  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins === 1) return '1 min ago'
    if (mins < 60) return `${mins} min ago`
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <motion.div
      layout
      initial={isNew ? { scale: 0.97, opacity: 0 } : false}
      animate={isNew ? { scale: [0.97, 1.015, 1], opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        tone="default"
        padding="md"
        radius="card"
        shadow="e1"
        className={cn('relative', isNew && `ring-2 ring-offset-2 ring-offset-bg ${ACCENT_RING[accent]}`)}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="h-9 w-9 rounded-lg bg-accent-powder-blue text-accent-ink-powder-blue flex items-center justify-center flex-shrink-0">
              <Bus className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-h4 text-text-primary truncate">{order.bus_name}</p>
              <p className="text-caption text-text-muted">#{shortId} · {timeAgo(order.created_at)}</p>
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <IconButton aria-label="Order actions" tone="ghost" size="sm" onClick={() => setMenuOpen((v) => !v)}>
              <MoreVertical className="h-4 w-4" />
            </IconButton>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 bg-surface border border-border rounded-lg shadow-e3 py-1.5 w-44 overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); setCancelOpen(true) }}
                    className="w-full text-left text-body-sm px-3.5 py-2 text-error hover:bg-error-bg transition-colors"
                  >
                    Cancel order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1.5 mb-4 pb-4 border-b border-border-subtle">
          {order.items.map((i) => (
            <div key={i.id} className="flex items-baseline justify-between gap-2 text-body-sm">
              <span className="text-text-primary truncate">{i.menu_item_name}</span>
              <span className="text-text-tertiary tabular-nums flex-shrink-0">× {i.quantity}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label text-text-muted">Total</p>
            <p className="text-h4 text-text-primary tabular-nums">₹{order.total_amount}</p>
          </div>
          {action && (
            <Button size="sm" variant={action.variant} onClick={() => onAdvance(order.id, action.next)}>
              {action.label}
            </Button>
          )}
        </div>
      </Card>

      <CancelOrderDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          await onCancel(order.id, reason)
          setCancelOpen(false)
        }}
        orderShortId={shortId}
      />
    </motion.div>
  )
}
