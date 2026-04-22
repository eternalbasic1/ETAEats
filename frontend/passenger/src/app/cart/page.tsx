'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthBottomSheet } from '@/components/cart/AuthBottomSheet'
import { Button } from '@/components/ui'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { Cart } from '@/lib/api.types'

export default function CartPage() {
  const router = useRouter()
  const { cartId, items, setCart, totalPrice } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [authOpen, setAuthOpen] = useState(false)

  async function handleRemove(cartItemId: number) {
    if (!cartId) return
    try {
      const { data } = await api.delete<Cart>(`/orders/cart/items/${cartItemId}/`)
      setCart(cartId, data.bus, data.restaurant, data.items)
    } catch {
      toast.error('Could not remove item.')
    }
  }

  async function handleUpdate(cartItemId: number, quantity: number) {
    if (!cartId) return
    try {
      const { data } = await api.patch<Cart>(`/orders/cart/items/${cartItemId}/`, { quantity })
      setCart(cartId, data.bus, data.restaurant, data.items)
    } catch {
      toast.error('Could not update quantity.')
    }
  }

  function handleCheckout() {
    if (!isAuthenticated) {
      setAuthOpen(true)
      return
    }
    router.push('/checkout')
  }

  function onAuthSuccess() {
    setAuthOpen(false)
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 p-6 text-center">
        <ShoppingBag className="h-12 w-12 text-text-muted" />
        <p className="text-text-secondary">Your cart is empty</p>
        <button
          onClick={() => router.back()}
          className="text-primary-soft text-sm font-semibold"
        >
          ← Go back to menu
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      <div className="sticky top-0 z-10 bg-bg border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Your Cart</h1>
        <span className="text-sm text-text-muted ml-auto">
          {items.length} item{items.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="px-4 py-2">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            className="flex items-center gap-3 py-4 border-b border-white/5"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">{item.menu_item_name}</p>
              <p className="text-sm text-primary-soft font-bold mt-0.5">
                ₹{item.unit_price} × {item.quantity}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-surface2 rounded-lg border border-white/8 overflow-hidden">
              <button
                onClick={() =>
                  item.quantity > 1
                    ? handleUpdate(item.id, item.quantity - 1)
                    : handleRemove(item.id)
                }
                className="px-3 py-1.5 text-primary-soft"
              >
                −
              </button>
              <span className="px-2 py-1.5 text-sm font-bold text-text-primary">
                {item.quantity}
              </span>
              <button
                onClick={() => handleUpdate(item.id, item.quantity + 1)}
                className="px-3 py-1.5 text-primary-soft"
              >
                +
              </button>
            </div>
            <button onClick={() => handleRemove(item.id)} className="ml-1">
              <Trash2 className="h-4 w-4 text-text-muted" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-surface2 border border-white/8 p-4">
        <div className="flex justify-between text-sm text-text-secondary mb-2">
          <span>Subtotal</span>
          <span>₹{totalPrice().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-text-primary border-t border-white/8 pt-2 mt-2">
          <span>Total</span>
          <span>₹{totalPrice().toFixed(2)}</span>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-bg border-t border-white/8">
        <Button className="w-full" size="lg" onClick={handleCheckout}>
          Place Order · ₹{totalPrice().toFixed(0)}
        </Button>
      </div>

      <AuthBottomSheet
        open={authOpen}
        onSuccess={onAuthSuccess}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  )
}
