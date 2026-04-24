'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StatTile }            from '@/components/analytics/StatTile'
import { HourlyRevenueChart }  from '@/components/analytics/HourlyRevenueChart'
import { TopItemsList }        from '@/components/analytics/TopItemsList'
import { Card, Spinner }       from '@/components/ui'
import api from '@/lib/api'
import type { Order, Paginated } from '@/lib/api.types'

export default function AnalyticsPage() {
  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'today'],
    queryFn: () =>
      api
        .get<Paginated<Order>>(`/orders/restaurant/?page_size=200&created_at__gte=${encodeURIComponent(todayStart)}`)
        .then((r) => r.data.results),
  })

  const orders = data ?? []

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status !== 'CANCELLED')
    const cancelled = orders.filter((o) => o.status === 'CANCELLED')
    const revenue = paid.reduce((s, o) => s + parseFloat(o.total_amount), 0)

    // Top items
    const itemCounts = new Map<string, { count: number; revenue: number }>()
    paid.forEach((o) => {
      o.items.forEach((i) => {
        const existing = itemCounts.get(i.menu_item_name) ?? { count: 0, revenue: 0 }
        existing.count += i.quantity
        existing.revenue += parseFloat(i.line_total)
        itemCounts.set(i.menu_item_name, existing)
      })
    })
    const topItems = [...itemCounts.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Hourly buckets (00..23)
    const buckets: { hour: string; revenue: number; orders: number }[] = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, '0')}:00`,
      revenue: 0,
      orders: 0,
    }))
    paid.forEach((o) => {
      const h = new Date(o.created_at).getHours()
      const bucket = buckets[h]
      if (bucket) {
        bucket.revenue += parseFloat(o.total_amount)
        bucket.orders += 1
      }
    })
    // Trim to hours that have data so the chart is readable
    const firstIdx = buckets.findIndex((b) => b.orders > 0)
    const lastIdx = buckets.length - 1 - [...buckets].reverse().findIndex((b) => b.orders > 0)
    const trimmed = firstIdx === -1 ? [] : buckets.slice(firstIdx, lastIdx + 1)

    return {
      revenue,
      orderCount: paid.length,
      cancelledCount: cancelled.length,
      topItems,
      hourly: trimmed,
    }
  }, [orders])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="Today's revenue"
          value={`₹${stats.revenue.toFixed(0)}`}
          delta={`${stats.orderCount} paid order${stats.orderCount !== 1 ? 's' : ''}`}
          accent="primary"
        />
        <StatTile
          label="Orders completed"
          value={String(stats.orderCount)}
          accent="success"
        />
        <StatTile
          label="Cancelled"
          value={String(stats.cancelledCount)}
          accent="error"
        />
      </div>

      <Card>
        <h2 className="text-sm font-bold text-text-primary mb-4">Revenue by hour</h2>
        {stats.hourly.length === 0 ? (
          <p className="text-sm text-text-muted py-8 text-center">No orders yet today.</p>
        ) : (
          <HourlyRevenueChart data={stats.hourly} />
        )}
      </Card>

      <TopItemsList items={stats.topItems} />
    </div>
  )
}
