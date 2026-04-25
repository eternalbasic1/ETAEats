'use client'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { Stepper } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { CartItem, MenuItem } from '@/lib/api.types'

interface MenuItemRowProps {
  item: MenuItem
  cartItem: CartItem | undefined
  onAdd: (item: MenuItem) => void
  onIncrement: (cartItemId: number) => void
  onDecrement: (cartItemId: number, quantity: number) => void
}

export function MenuItemRow({ item, cartItem, onAdd, onIncrement, onDecrement }: MenuItemRowProps) {
  const unavailable = !item.is_available

  return (
    <div
      className={cn(
        'group flex items-start gap-4 py-4 lg:py-5 border-b border-border-subtle last:border-0',
        unavailable && 'opacity-45',
      )}
    >
      <div className="h-16 w-16 lg:h-20 lg:w-20 flex-shrink-0 rounded-xl bg-accent-soft-cream border border-border-subtle flex items-center justify-center text-3xl">
        🍛
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-body lg:text-body-lg font-semibold text-text-primary truncate">{item.name}</p>
          {unavailable && (
            <span className="flex-shrink-0 text-[10.5px] uppercase tracking-[0.08em] text-text-muted bg-surface2 border border-border px-2 py-0.5 rounded-pill font-semibold">
              Unavailable
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-body-sm text-text-tertiary line-clamp-2 mt-1">{item.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2">
          <span className="text-h4 text-text-primary">₹{item.price}</span>
          <span className="inline-flex items-center gap-1 text-caption text-text-muted">
            <Clock className="h-3 w-3" />
            {item.prep_time_minutes} min
          </span>
        </div>
      </div>

      {!unavailable && (
        <div className="flex-shrink-0 self-center">
          {cartItem ? (
            <Stepper
              value={cartItem.quantity}
              onIncrement={() => onIncrement(cartItem.id)}
              onDecrement={() => onDecrement(cartItem.id, cartItem.quantity)}
              size="md"
            />
          ) : (
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -1 }}
              onClick={() => onAdd(item)}
              className="inline-flex h-10 items-center justify-center rounded-pill bg-primary text-text-on-dark px-5 text-[13px] font-semibold tracking-[0.02em] shadow-e1 hover:shadow-cta transition-shadow duration-base ease-standard"
            >
              Add
            </motion.button>
          )}
        </div>
      )}
    </div>
  )
}
