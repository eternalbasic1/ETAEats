'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Package, Clock3 } from 'lucide-react'
import { Badge, Spinner } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useOrderTrackingStore } from '@/stores/orderTracking.store'
import api from '@/lib/api'
import type { Order, Paginated, OrderStatus } from '@/lib/api.types'

const LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  PICKED_UP: 'Picked up',
  CANCELLED: 'Cancelled',
}

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const { activeOrder, setActiveOrder } = useOrderTrackingStore()

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) router.replace('/auth/login')
  }, [hasHydrated, isAuthenticated, router])

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'home'],
    queryFn: () => api.get<Paginated<Order>>('/orders/my/?page_size=8').then((r) => r.data),
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (!data?.results?.length) return
    const live = data.results.find((o) => !['PICKED_UP', 'CANCELLED'].includes(o.status))
    if (live) {
      setActiveOrder({
        id: live.id,
        restaurantName: live.restaurant_name,
        totalAmount: live.total_amount,
        createdAt: live.created_at,
        status: live.status,
      })
    }
  }, [data, setActiveOrder])

  if (!hasHydrated || !isAuthenticated) return null

  return (
    <div className="min-h-screen bg-bg p-4 pb-24">
      <section className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs uppercase tracking-wider text-text-muted mb-2">ETA Eats</p>
        <h1 className="text-xl font-bold text-text-primary">
          Order food before your bus reaches the stop
        </h1>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href="/scan"
            className="rounded-xl bg-primary text-white px-4 py-3 text-sm font-semibold text-center"
          >
            Open Scanner
          </Link>
          <Link
            href="/scan"
            className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-primary text-center"
          >
            Enter QR Code
          </Link>
        </div>
      </section>

      {activeOrder && (
        <button
          onClick={() => router.push(`/order/${activeOrder.id}`)}
          className="w-full mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">Active order</p>
              <p className="text-sm font-semibold text-text-primary">{activeOrder.restaurantName}</p>
            </div>
            <Badge variant="primary" dot>{LABEL[activeOrder.status]}</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Order #{activeOrder.id.slice(0, 8)} · ₹{activeOrder.totalAmount}
          </p>
        </button>
      )}

      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock3 className="h-4 w-4 text-text-muted" />
          <h2 className="text-sm font-bold text-text-primary">Recent orders</h2>
        </div>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        )}
        {!isLoading && !data?.results?.length && (
          <div className="rounded-xl border border-border bg-surface2 p-6 text-center">
            <Package className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No orders yet.</p>
          </div>
        )}
        {data?.results?.slice(0, 3).map((order) => (
          <button
            key={order.id}
            onClick={() => router.push(`/order/${order.id}`)}
            className="w-full rounded-xl border border-border bg-surface p-4 mb-2 text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-text-primary">{order.restaurant_name}</p>
                <p className="text-xs text-text-muted">#{order.id.slice(0, 8)}</p>
              </div>
              <Badge variant="muted">{LABEL[order.status]}</Badge>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              {order.items.slice(0, 2).map((i) => i.menu_item_name).join(', ')}
            </p>
          </button>
        ))}
      </section>

    </div>
  )
}
