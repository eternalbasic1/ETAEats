'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package } from 'lucide-react'
import { Badge, Spinner } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { Order, OrderStatus, Paginated } from '@/lib/api.types'

const STATUS_BADGE: Record<
  OrderStatus,
  { variant: 'primary' | 'success' | 'error' | 'warning' | 'muted'; label: string }
> = {
  PENDING:   { variant: 'warning', label: 'Pending' },
  CONFIRMED: { variant: 'primary', label: 'Confirmed' },
  PREPARING: { variant: 'primary', label: 'Preparing' },
  READY:     { variant: 'success', label: 'Ready' },
  PICKED_UP: { variant: 'muted',   label: 'Picked Up' },
  CANCELLED: { variant: 'error',   label: 'Cancelled' },
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/scan/invalid')
  }, [isAuthenticated, router])

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () =>
      api.get<Paginated<Order>>('/orders/my/').then((r) => r.data),
    enabled: isAuthenticated,
  })

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-10 bg-bg border-b border-white/8 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Order History</h1>
      </div>

      <div className="px-4 py-4">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {!isLoading && data?.results.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No orders yet</p>
          </div>
        )}

        {data?.results.map((order) => {
          const badge = STATUS_BADGE[order.status]
          return (
            <button
              key={order.id}
              onClick={() => router.push(`/order/${order.id}`)}
              className="w-full text-left rounded-xl bg-surface2 border border-white/8 p-4 mb-3"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {order.restaurant_name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    #{order.id.slice(0, 8)} ·{' '}
                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <p className="text-xs text-text-secondary">
                {order.items
                  .map((i) => `${i.menu_item_name} ×${i.quantity}`)
                  .join(', ')}
              </p>
              <p className="text-sm font-bold text-text-primary mt-2">
                ₹{order.total_amount}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
