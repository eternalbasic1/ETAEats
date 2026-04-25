'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { PartyPopper } from 'lucide-react'
import { Badge, Card, Spinner } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'
import { StatusStepper } from '@/components/order/StatusStepper'
import { useOrderSocket } from '@/hooks/useOrderSocket'
import { useOrderTrackingStore } from '@/stores/orderTracking.store'
import api from '@/lib/api'
import type { Order, OrderStatus } from '@/lib/api.types'

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null)
  const { setActiveOrder, updateOrderStatus, clearIfComplete } = useOrderTrackingStore()

  const { connectionState } = useOrderSocket({
    orderId,
    onStatusChange: (status) => {
      setLiveStatus(status)
      updateOrderStatus(status)
      if (status === 'PICKED_UP') clearIfComplete()
    },
  })

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get<Order>(`/orders/my/${orderId}/`).then((r) => r.data),
    refetchInterval: connectionState === 'disconnected' ? 8000 : false,
  })

  const effectiveStatus = liveStatus ?? order?.status ?? 'PENDING'

  useEffect(() => {
    if (!order) return
    setActiveOrder({
      id: order.id,
      restaurantName: order.restaurant_name,
      totalAmount: order.total_amount,
      createdAt: order.created_at,
      status: effectiveStatus,
    })
  }, [order, effectiveStatus, setActiveOrder])

  if (isLoading || !order) {
    return (
      <div className="app-shell">
        <div className="app-shell-inner flex items-center justify-center pt-20">
          <Spinner className="h-7 w-7" />
        </div>
      </div>
    )
  }

  const connectionBadge = (() => {
    if (connectionState === 'connected') return <Badge variant="mint" size="sm" dot>Live</Badge>
    if (connectionState === 'reconnecting') return <Badge variant="cream" size="sm" dot>Reconnecting…</Badge>
    return <Badge variant="neutral" size="sm">Offline</Badge>
  })()

  return (
    <div className="app-shell slux-fade-in">
      <div className="app-shell-inner lg:pt-10">
        <TopBar
          title={order.restaurant_name}
          subtitle={`Order #${order.id.slice(0, 8)}`}
          onBack={() => router.push('/home')}
          right={connectionBadge}
        />

        <div className="px-4 lg:px-0 pb-10 space-y-6">
          {effectiveStatus === 'READY' && (
            <Card tone="peach" padding="md" radius="card" bordered={false} shadow="e2">
              <div className="flex items-start gap-3">
                <span className="h-10 w-10 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
                  <PartyPopper className="h-5 w-5 text-accent-ink-peach" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-h4 text-text-primary">Your food is ready</p>
                  <p className="text-body-sm text-accent-ink-peach mt-1">Head to the counter to pick it up.</p>
                </div>
              </div>
            </Card>
          )}

          <Card tone="default" padding="md" radius="card" shadow="e1">
            <p className="text-label text-text-muted">Progress</p>
            <div className="mt-5">
              <StatusStepper
                currentStatus={effectiveStatus}
                timestamps={{
                  created_at: order.created_at,
                  confirmed_at: order.confirmed_at,
                  ready_at: order.ready_at,
                  picked_up_at: order.picked_up_at,
                }}
              />
            </div>
          </Card>

          <Card tone="default" padding="md" radius="card" shadow="e1">
            <p className="text-label text-text-muted">Your order</p>
            <div className="mt-4 space-y-2.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-baseline justify-between text-body-sm">
                  <span className="text-text-secondary truncate pr-3">
                    {item.menu_item_name} <span className="text-text-muted">× {item.quantity}</span>
                  </span>
                  <span className="text-text-primary font-medium tabular-nums">₹{item.line_total}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between items-baseline">
              <span className="text-h4 text-text-primary">Total</span>
              <span className="text-h3 text-text-primary tabular-nums">₹{order.total_amount}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
