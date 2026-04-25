'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Bus, Receipt, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { useJourneyStore } from '@/stores/journey.store'
import { useOrderTrackingStore } from '@/stores/orderTracking.store'
import { openRazorpay } from '@/lib/razorpay'
import api from '@/lib/api'
import type { Cart, Order, RazorpayOrderPayload } from '@/lib/api.types'

export default function CheckoutPage() {
  const router = useRouter()
  const { cartId, busId, items, totalPrice, clearCart, setCart } = useCartStore()
  const { user } = useAuthStore()
  const { activeJourney } = useJourneyStore()
  const { setActiveOrder } = useOrderTrackingStore()
  const bus = activeJourney?.bus ?? null
  const restaurant = activeJourney?.restaurant ?? null
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    let effectiveCartId = cartId
    let effectiveBusId = busId ?? bus?.id ?? null

    if (!effectiveCartId || !effectiveBusId) {
      try {
        const { data: serverCart } = await api.get<Cart>('/orders/cart/')
        if (serverCart.id && serverCart.items.length > 0) {
          const recoveredBusId = serverCart.bus ?? bus?.id ?? null
          setCart(serverCart.id, serverCart.bus, serverCart.restaurant, serverCart.items)
          effectiveCartId = serverCart.id
          effectiveBusId = recoveredBusId
        }
      } catch { /* fall through */ }
    }

    if (!effectiveCartId || !effectiveBusId) {
      toast.error('Cart session expired. Please go back and try again.')
      return
    }
    setLoading(true)
    try {
      const { data: order } = await api.post<Order>('/orders/checkout/', {
        cart_id: effectiveCartId,
        bus_id: effectiveBusId,
      })
      const { data: rpPayload } = await api.post<RazorpayOrderPayload>('/payments/razorpay/order/', { order_id: order.id })
      await openRazorpay(
        rpPayload,
        user?.phone_number ?? '',
        async (rpResponse) => {
          try {
            await api.post('/payments/razorpay/confirm/', {
              order_id: order.id,
              razorpay_order_id: rpResponse.razorpay_order_id,
              razorpay_payment_id: rpResponse.razorpay_payment_id,
              razorpay_signature: rpResponse.razorpay_signature,
            })
            setActiveOrder({
              id: order.id,
              restaurantName: order.restaurant_name,
              totalAmount: order.total_amount,
              createdAt: order.created_at,
              status: 'CONFIRMED',
            })
            clearCart()
            router.replace('/home')
          } catch {
            toast.error('Payment confirmation failed. Your order ID is: ' + order.id.slice(0, 8))
            router.replace(`/order/${order.id}`)
          }
        },
        () => {
          toast('Payment cancelled.')
          setLoading(false)
        },
      )
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(axiosErr?.response?.data?.error?.message ?? 'Checkout failed. Please try again.')
      setLoading(false)
    }
  }

  const subtotal = totalPrice()

  return (
    <div className="app-shell slux-fade-in">
      <div className="app-shell-inner lg:pt-10">
        <TopBar title="Review & pay" onBack={() => router.back()} />

        <div className="pb-40 space-y-4">
          <Card tone="powder" padding="md" radius="card" bordered={false} shadow="e1">
            <p className="text-label text-accent-ink-powder-blue">Pickup from</p>
            <div className="mt-3 flex items-start gap-3">
              <span className="h-10 w-10 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-accent-ink-powder-blue" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="text-h4 text-text-primary truncate">{restaurant?.name}</p>
                <p className="text-body-sm text-text-tertiary mt-0.5 line-clamp-2">{restaurant?.address}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/40 flex items-center gap-3">
              <span className="h-10 w-10 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                <Bus className="h-4 w-4 text-accent-ink-powder-blue" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="text-label text-accent-ink-powder-blue">Your bus</p>
                <p className="text-body text-text-primary mt-0.5">
                  <span className="font-semibold">{bus?.name}</span> · {bus?.numberPlate}
                </p>
              </div>
            </div>
          </Card>

          <Card tone="default" padding="md" radius="card" shadow="e1">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-text-muted" strokeWidth={1.8} />
              <p className="text-label text-text-muted">Your order</p>
            </div>
            <div className="mt-4 space-y-2.5">
              {items.map((item) => (
                <div key={item.id} className="flex items-baseline justify-between text-body-sm">
                  <span className="text-text-secondary truncate pr-3">
                    {item.menu_item_name} <span className="text-text-muted">× {item.quantity}</span>
                  </span>
                  <span className="text-text-primary font-medium tabular-nums flex-shrink-0">₹{item.line_total}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border-subtle flex items-baseline justify-between">
              <span className="text-h4 text-text-primary">Total</span>
              <span className="text-h2 text-text-primary tabular-nums">₹{subtotal.toFixed(2)}</span>
            </div>
          </Card>

          <div className="flex items-start gap-2 text-caption text-text-muted px-1">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.9} />
            <p>Payments are encrypted and processed by Razorpay. Your card details never touch our servers.</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 lg:bottom-8 inset-x-0 z-40 px-4 lg:pr-10 lg:pl-[calc(var(--rail-width,18rem)+4rem)] xl:pl-[calc(var(--rail-width,18rem)+5rem)]">
        <div className="mx-auto w-full max-w-md lg:max-w-3xl">
          <Button fullWidth size="lg" onClick={handlePay} loading={loading}>
            Pay ₹{subtotal.toFixed(0)} securely
          </Button>
        </div>
      </div>
    </div>
  )
}
