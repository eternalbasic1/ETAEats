'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KanbanColumn } from '@/components/orders/KanbanColumn'
import { Spinner } from '@/components/ui'
import api from '@/lib/api'
import type { Order, OrderStatus, Paginated } from '@/lib/api.types'

interface AdvancePayload { orderId: string; status: OrderStatus; reason?: string }

export default function LiveOrdersPage() {
  const queryClient = useQueryClient()
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
  const previousIdsRef = useRef<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', 'live'],
    queryFn: () =>
      api
        .get<Paginated<Order>>('/orders/restaurant/?page_size=100')
        .then((r) => r.data),
    refetchInterval: 8000,
  })

  const orders = data?.results ?? []

  // Detect newly-arrived orders to apply pulse animation
  useEffect(() => {
    const currentIds = new Set(orders.map((o) => o.id))
    const additions = new Set<string>()
    currentIds.forEach((id) => {
      if (!previousIdsRef.current.has(id)) additions.add(id)
    })
    previousIdsRef.current = currentIds
    if (additions.size > 0 && previousIdsRef.current.size > additions.size) {
      setNewOrderIds(additions)
      const t = setTimeout(() => setNewOrderIds(new Set()), 2000)
      return () => clearTimeout(t)
    }
    return undefined
  }, [orders])

  const advanceMutation = useMutation({
    mutationFn: (p: AdvancePayload) =>
      api.post(`/orders/restaurant/${p.orderId}/advance/`, {
        status: p.status,
        ...(p.reason ? { reason: p.reason } : {}),
      }),
    onMutate: async ({ orderId, status }: AdvancePayload) => {
      await queryClient.cancelQueries({ queryKey: ['orders', 'live'] })
      const prev = queryClient.getQueryData<Paginated<Order>>(['orders', 'live'])
      if (prev) {
        queryClient.setQueryData<Paginated<Order>>(['orders', 'live'], {
          ...prev,
          results: prev.results.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })
      }
      return { prev }
    },
    onError: (err: unknown, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['orders', 'live'], ctx.prev)
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(axiosErr?.response?.data?.error?.message ?? 'Could not update order.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'live'] })
    },
  })

  const handleAdvance = useCallback(
    async (orderId: string, status: OrderStatus): Promise<void> => {
      await advanceMutation.mutateAsync({ orderId, status })
    },
    [advanceMutation],
  )
  const handleCancel = useCallback(
    async (orderId: string, reason: string): Promise<void> => {
      await advanceMutation.mutateAsync({ orderId, status: 'CANCELLED', reason })
    },
    [advanceMutation],
  )

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <p className="text-sm text-text-secondary">Could not load orders.</p>
        <button onClick={() => refetch()} className="text-sm text-primary font-semibold">Retry</button>
      </div>
    )
  }

  const newOrders     = orders.filter((o) => o.status === 'PENDING')
  const cookingOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING')
  const readyOrders   = orders.filter((o) => o.status === 'READY')

  return (
    <div className="h-full p-6">
      <div className="h-full flex gap-4 min-h-0">
        <KanbanColumn
          title="New"
          count={newOrders.length}
          accent="primary"
          orders={newOrders}
          newOrderIds={newOrderIds}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
        />
        <KanbanColumn
          title="Cooking"
          count={cookingOrders.length}
          accent="warning"
          orders={cookingOrders}
          newOrderIds={newOrderIds}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
        />
        <KanbanColumn
          title="Ready"
          count={readyOrders.length}
          accent="success"
          orders={readyOrders}
          newOrderIds={newOrderIds}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
