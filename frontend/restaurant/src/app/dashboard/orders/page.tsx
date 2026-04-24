'use client'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Badge, Card, Input, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Order, OrderStatus, Paginated } from '@/lib/api.types'

const STATUS_VARIANT: Record<OrderStatus, 'primary' | 'success' | 'warning' | 'error' | 'muted'> = {
  PENDING:   'warning',
  CONFIRMED: 'primary',
  PREPARING: 'primary',
  READY:     'success',
  PICKED_UP: 'muted',
  CANCELLED: 'error',
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'all'

function startOf(preset: DatePreset): Date | null {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (preset === 'today') return d
  if (preset === 'yesterday') { d.setDate(d.getDate() - 1); return d }
  if (preset === 'week') { d.setDate(d.getDate() - 6); return d }
  return null
}
function endOf(preset: DatePreset): Date | null {
  if (preset !== 'yesterday') return null
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setMilliseconds(-1)
  return d
}

export default function OrderHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [datePreset, setDatePreset]     = useState<DatePreset>('today')
  const [busSearch, setBusSearch]       = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'history'],
    queryFn: () =>
      api
        .get<Paginated<Order>>('/orders/restaurant/?page_size=200&ordering=-created_at')
        .then((r) => r.data),
  })

  const orders = data?.results ?? []

  const filtered = useMemo(() => {
    const fromDate = startOf(datePreset)
    const toDate = endOf(datePreset)
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
      const created = new Date(o.created_at)
      if (fromDate && created < fromDate) return false
      if (toDate && created > toDate) return false
      if (busSearch && !o.bus_name.toLowerCase().includes(busSearch.toLowerCase())) return false
      return true
    })
  }, [orders, statusFilter, datePreset, busSearch])

  const statusChips: (OrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED']

  return (
    <div className="p-6 space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-secondary uppercase">Status:</span>
            {statusChips.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'text-xs font-semibold rounded-full px-3 py-1 border transition-colors',
                  statusFilter === s
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-secondary border-border hover:border-primary',
                )}
              >
                {s === 'ALL' ? 'All' : s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-secondary uppercase">Date:</span>
            {(['today', 'yesterday', 'week', 'all'] as DatePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setDatePreset(p)}
                className={cn(
                  'text-xs font-semibold rounded-full px-3 py-1 border transition-colors capitalize',
                  datePreset === p
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-secondary border-border hover:border-primary',
                )}
              >
                {p === 'week' ? 'This week' : p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search by bus name or plate…"
              value={busSearch}
              onChange={(e) => setBusSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>
      </Card>

      {/* Results */}
      {isLoading && (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-text-secondary">No orders match these filters.</p>
        </Card>
      )}

      {!isLoading && filtered.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Bus</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-surface2">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">#{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-text-primary">{o.bus_name}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs truncate max-w-[260px]">
                    {o.items.map((i) => `${i.menu_item_name} ×${i.quantity}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-text-primary">₹{o.total_amount}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
