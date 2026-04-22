'use client'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
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
    <div className={cn(
      'flex items-center gap-3 py-3 border-b border-white/5',
      unavailable && 'opacity-40',
    )}>
      <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-surface2 flex items-center justify-center text-2xl">
        🍛
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
          {unavailable && (
            <span className="flex-shrink-0 text-xs text-text-muted bg-surface2 px-2 py-0.5 rounded-full">
              Unavailable
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-text-secondary truncate mt-0.5">{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm font-bold text-primary-soft">₹{item.price}</span>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="h-3 w-3" />{item.prep_time_minutes} min
          </span>
        </div>
      </div>

      {!unavailable && (
        <div className="flex-shrink-0">
          {cartItem ? (
            <div className="flex items-center rounded-lg border border-primary/40 bg-surface2 overflow-hidden">
              <button
                onClick={() => onDecrement(cartItem.id, cartItem.quantity)}
                className="px-3 py-1.5 text-primary-soft text-base font-bold"
              >−</button>
              <span className="px-2 py-1.5 text-sm font-bold text-text-primary bg-primary/10">
                {cartItem.quantity}
              </span>
              <button
                onClick={() => onIncrement(cartItem.id)}
                className="px-3 py-1.5 text-primary-soft text-base font-bold"
              >+</button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => onAdd(item)}
              className="rounded-lg bg-gradient-primary text-white text-xs font-bold px-4 py-2 shadow shadow-primary/30"
            >
              + ADD
            </motion.button>
          )}
        </div>
      )}
    </div>
  )
}
