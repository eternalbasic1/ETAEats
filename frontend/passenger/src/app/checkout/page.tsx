'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
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

    // Recover from backend cart if local persisted snapshot is missing fields.
    if (!effectiveCartId || !effectiveBusId) {
      try {
        const { data: serverCart } = await api.get<Cart>('/orders/cart/')
        if (serverCart.id && serverCart.items.length > 0) {
          const recoveredBusId = serverCart.bus ?? bus?.id ?? null
          setCart(serverCart.id, serverCart.bus, serverCart.restaurant, serverCart.items)
          effectiveCartId = serverCart.id
          effectiveBusId = recoveredBusId
        }
      } catch {
        // keep fallback guard below
      }
    }

    if (!effectiveCartId || !effectiveBusId) {
      toast.error('Cart session expired. Please go back and try again.')
      return
    }
    setLoading(true)
    try {
      // 1. Checkout cart → create PENDING order
      const { data: order } = await api.post<Order>('/orders/checkout/', {
        cart_id: effectiveCartId,
        bus_id: effectiveBusId,
      })

      // 2. Create Razorpay order
      const { data: rpPayload } = await api.post<RazorpayOrderPayload>(
        '/payments/razorpay/order/',
        { order_id: order.id },
      )

      // 3. Open Razorpay checkout sheet
      await openRazorpay(
        rpPayload,
        user?.phone_number ?? '',
        async (rpResponse) => {
          // 4. Confirm payment signature with backend
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

  return (
    <div className="app-shell">
      <div className="app-shell-inner">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Order Summary</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Bus + Restaurant */}
        <div className="rounded-xl bg-surface border border-border p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Pickup from</p>
          <p className="text-sm font-semibold text-text-primary">{restaurant?.name}</p>
          <p className="text-xs text-text-secondary mt-0.5">{restaurant?.address}</p>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Your bus</p>
            <p className="text-sm text-text-primary">
              {bus?.name} · {bus?.numberPlate}
            </p>
          </div>
        </div>

        {/* Order items */}
        <div className="rounded-xl bg-surface border border-border p-4 space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Your order</p>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-text-secondary">
                {item.menu_item_name} × {item.quantity}
              </span>
              <span className="text-text-primary font-medium">₹{item.line_total}</span>
            </div>
          ))}
          <div className="flex justify-between text-base font-bold text-text-primary border-t border-border pt-3 mt-2">
            <span>Total</span>
            <span>₹{totalPrice().toFixed(2)}</span>
          </div>
        </div>
      </div>
      </div>

      {/* Pay CTA */}
      <div className="fixed bottom-24 inset-x-0 p-4 bg-bg border-t border-border z-30">
        <div className="mx-auto w-full max-w-md">
          <Button className="w-full" size="lg" onClick={handlePay} loading={loading}>
            Pay ₹{totalPrice().toFixed(0)} with Razorpay
          </Button>
        </div>
      </div>

    </div>
  )
}
