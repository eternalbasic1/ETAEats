'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, EmptyState, IconButton, Stepper } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { Cart } from '@/lib/api.types'

export default function CartPage() {
  const router = useRouter()
  const { cartId, items, setCart, totalPrice } = useCartStore()
  const { isAuthenticated } = useAuthStore()

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
    if (!isAuthenticated) return router.push('/auth/login')
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="app-shell">
        <div className="app-shell-inner pt-12">
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" strokeWidth={1.7} />}
            tone="cream"
            title="Your cart is empty"
            description="Add something you love from the menu to get started."
            action={<Button variant="secondary" onClick={() => router.back()}>Back to menu</Button>}
          />
        </div>
      </div>
    )
  }

  const subtotal = totalPrice()

  return (
    <div className="app-shell slux-fade-in">
      <div className="app-shell-inner lg:pt-10">
        <TopBar
          title="Your cart"
          subtitle={`${items.length} item${items.length > 1 ? 's' : ''}`}
          onBack={() => router.back()}
        />

        <div className="pb-40 space-y-4">
          <Card tone="default" padding="none" radius="card" shadow="e1" className="px-5 py-2">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                className="flex items-center gap-4 py-4 border-b border-border-subtle last:border-0"
              >
                <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-accent-soft-cream border border-border-subtle flex items-center justify-center text-2xl">
                  🍛
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-text-primary truncate">{item.menu_item_name}</p>
                  <p className="text-body-sm text-text-tertiary mt-0.5">₹{item.unit_price} each</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Stepper
                    value={item.quantity}
                    onIncrement={() => handleUpdate(item.id, item.quantity + 1)}
                    onDecrement={() =>
                      item.quantity > 1 ? handleUpdate(item.id, item.quantity - 1) : handleRemove(item.id)
                    }
                    size="sm"
                  />
                  <IconButton aria-label="Remove" tone="ghost" size="sm" onClick={() => handleRemove(item.id)}>
                    <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                  </IconButton>
                </div>
              </motion.div>
            ))}
          </Card>

          <Card tone="sunk" padding="md" radius="card" bordered shadow="none">
            <p className="text-label text-text-muted">Summary</p>
            <div className="mt-3 flex justify-between text-body-sm text-text-tertiary">
              <span>Subtotal</span>
              <span className="text-text-primary font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between text-body-sm text-text-tertiary">
              <span>Delivery</span>
              <span className="text-text-primary font-medium">Pickup · Free</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between items-baseline">
              <span className="text-h4 text-text-primary">Total</span>
              <span className="text-h2 text-text-primary">₹{subtotal.toFixed(2)}</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-24 lg:bottom-8 inset-x-0 z-40 px-4 lg:pr-10 lg:pl-[calc(var(--rail-width,18rem)+4rem)] xl:pl-[calc(var(--rail-width,18rem)+5rem)]">
        <div className="mx-auto w-full max-w-md lg:max-w-3xl">
          <Button fullWidth size="lg" onClick={handleCheckout}>
            Place order · ₹{subtotal.toFixed(0)}
          </Button>
        </div>
      </div>
    </div>
  )
}
