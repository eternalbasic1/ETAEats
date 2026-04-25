'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import { Badge, Card, EmptyState, Spinner } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { Order, OrderStatus, Paginated } from '@/lib/api.types'

const STATUS_BADGE: Record<OrderStatus, { variant: 'powder' | 'cream' | 'peach' | 'mint' | 'neutral' | 'error'; label: string }> = {
  PENDING:   { variant: 'cream',   label: 'Pending'   },
  CONFIRMED: { variant: 'powder',  label: 'Confirmed' },
  PREPARING: { variant: 'powder',  label: 'Preparing' },
  READY:     { variant: 'peach',   label: 'Ready'     },
  PICKED_UP: { variant: 'mint',    label: 'Picked up' },
  CANCELLED: { variant: 'error',   label: 'Cancelled' },
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, hasHydrated } = useAuthStore()

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) router.replace('/auth/login')
  }, [hasHydrated, isAuthenticated, router])

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<Paginated<Order>>('/orders/my/').then((r) => r.data),
    enabled: hasHydrated && isAuthenticated,
  })

  if (!hasHydrated || !isAuthenticated) return null

  return (
    <div className="app-shell slux-fade-in">
      <div className="app-shell-inner lg:pt-10">
        <TopBar title="Order history" onBack={() => router.push('/home')} />

        <div className="pb-10">
          {isLoading && (
            <div className="flex justify-center py-14">
              <Spinner className="h-7 w-7" />
            </div>
          )}

          {!isLoading && data?.results.length === 0 && (
            <EmptyState
              icon={<Package className="h-6 w-6" strokeWidth={1.7} />}
              tone="neutral"
              title="No orders yet"
              description="Scan a bus QR to place your first pre-order."
            />
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            {data?.results.map((order) => {
              const badge = STATUS_BADGE[order.status]
              return (
                <Card
                  key={order.id}
                  as="button"
                  tone="default"
                  padding="md"
                  radius="card"
                  shadow="e1"
                  interactive
                  onClick={() => router.push(`/order/${order.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-h4 text-text-primary truncate">{order.restaurant_name}</p>
                      <p className="text-caption text-text-muted mt-0.5">
                        #{order.id.slice(0, 8)} ·{' '}
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                  </div>
                  <p className="text-body-sm text-text-tertiary line-clamp-2">
                    {order.items.map((i) => `${i.menu_item_name} ×${i.quantity}`).join(' · ')}
                  </p>
                  <p className="mt-3 text-h4 text-text-primary">₹{order.total_amount}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
