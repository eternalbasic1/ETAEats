'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Badge, Spinner } from '@/components/ui'
import { StatusStepper } from '@/components/order/StatusStepper'
import { useOrderSocket } from '@/hooks/useOrderSocket'
import api from '@/lib/api'
import type { Order, OrderStatus } from '@/lib/api.types'

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null)

  const { connectionState } = useOrderSocket({
    orderId,
    onStatusChange: (status) => {
      setLiveStatus(status)
      if (status === 'PICKED_UP') {
        setTimeout(() => router.replace(`/order/${orderId}/complete`), 1500)
      }
    },
  })

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get<Order>(`/orders/my/${orderId}/`).then((r) => r.data),
    // Poll every 8 seconds when WebSocket is disconnected (fallback)
    refetchInterval: connectionState === 'disconnected' ? 8000 : false,
  })

  const effectiveStatus = liveStatus ?? order?.status ?? 'PENDING'

  useEffect(() => {
    if (effectiveStatus === 'PICKED_UP') {
      router.replace(`/order/${orderId}/complete`)
    }
  }, [effectiveStatus, orderId, router])

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-10 bg-bg border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-text-primary">
              {order.restaurant_name}
            </h1>
            <p className="text-xs text-text-muted">Order #{order.id.slice(0, 8)}</p>
          </div>
          {connectionState === 'connected' && (
            <Badge variant="primary" dot>LIVE</Badge>
          )}
          {connectionState === 'reconnecting' && (
            <Badge variant="warning" dot>Reconnecting…</Badge>
          )}
          {connectionState === 'disconnected' && (
            <Badge variant="muted">Offline</Badge>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {effectiveStatus === 'READY' && (
          <div className="rounded-xl bg-success-bg border border-success/30 p-4 mb-6 text-center">
            <p className="text-success font-bold">🔔 Your food is ready!</p>
            <p className="text-sm text-text-secondary mt-1">
              Head to the counter to pick it up.
            </p>
          </div>
        )}

        <StatusStepper
          currentStatus={effectiveStatus}
          timestamps={{
            created_at: order.created_at,
            confirmed_at: order.confirmed_at,
            ready_at: order.ready_at,
            picked_up_at: order.picked_up_at,
          }}
        />

        <div className="mt-8 rounded-xl bg-surface border border-border p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Your order</p>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span className="text-text-secondary">
                {item.menu_item_name} × {item.quantity}
              </span>
              <span className="text-text-primary">₹{item.line_total}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold text-text-primary border-t border-border pt-2 mt-2">
            <span>Total</span>
            <span>₹{order.total_amount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
