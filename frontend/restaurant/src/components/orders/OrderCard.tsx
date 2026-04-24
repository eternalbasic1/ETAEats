'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { CancelOrderDialog } from './CancelOrderDialog'
import type { Order, OrderStatus } from '@/lib/api.types'

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus; variant: 'primary' | 'success' }>> = {
  PENDING:   { label: 'Confirm',       next: 'CONFIRMED',  variant: 'primary' },
  CONFIRMED: { label: 'Start Cooking', next: 'PREPARING',  variant: 'primary' },
  PREPARING: { label: 'Mark Ready',    next: 'READY',      variant: 'success' },
  READY:     { label: 'Picked Up',     next: 'PICKED_UP',  variant: 'success' },
}

interface OrderCardProps {
  order: Order
  isNew?: boolean
  accent: 'primary' | 'warning' | 'success'
  onAdvance: (orderId: string, next: OrderStatus) => Promise<void> | void
  onCancel: (orderId: string, reason: string) => Promise<void> | void
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
      initial={isNew ? { scale: 0.95, opacity: 0 } : false}
      animate={isNew ? { scale: [0.95, 1.03, 1], opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card accent={accent} className="relative">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-bold text-primary">{order.bus_name}</p>
            <p className="text-[10px] text-text-muted">#{shortId}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 text-text-muted hover:text-text-primary rounded"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-20 bg-surface border border-border rounded-md shadow-md py-1 w-36">
                  <button
                    onClick={() => { setMenuOpen(false); setCancelOpen(true) }}
                    className="w-full text-left text-xs px-3 py-2 text-error hover:bg-error-bg"
                  >
                    Cancel order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-0.5 mb-3">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between text-xs">
              <span className="text-text-primary truncate">{i.menu_item_name}</span>
              <span className="text-text-secondary flex-shrink-0">× {i.quantity}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-primary">₹{order.total_amount}</p>
            <p className="text-[10px] text-text-muted">{timeAgo(order.created_at)}</p>
          </div>
          {action && (
            <Button
              size="sm"
              variant={action.variant}
              onClick={() => onAdvance(order.id, action.next)}
            >
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
