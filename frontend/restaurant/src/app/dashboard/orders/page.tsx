'use client'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Badge, Card, Chip, EmptyState, Input, SectionHeader, Spinner } from '@/components/ui'
import api from '@/lib/api'
import type { Order, OrderStatus, Paginated } from '@/lib/api.types'

const STATUS_VARIANT: Record<OrderStatus, 'powder' | 'cream' | 'peach' | 'mint' | 'neutral' | 'error'> = {
  PENDING:   'cream',
  CONFIRMED: 'powder',
  PREPARING: 'powder',
  READY:     'peach',
  PICKED_UP: 'mint',
  CANCELLED: 'error',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:   'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY:     'Ready',
  PICKED_UP: 'Picked up',
  CANCELLED: 'Cancelled',
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

const STATUS_CHIPS: (OrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED']
const DATE_CHIPS: { value: DatePreset; label: string }[] = [
  { value: 'today',     label: 'Today'      },
  { value: 'yesterday', label: 'Yesterday'  },
  { value: 'week',      label: 'This week'  },
  { value: 'all',       label: 'All'        },
]

export default function OrderHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [datePreset, setDatePreset]     = useState<DatePreset>('today')
  const [busSearch, setBusSearch]       = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'history'],
    queryFn: () =>
      api.get<Paginated<Order>>('/orders/restaurant/?page_size=200&ordering=-created_at').then((r) => r.data),
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

  return (
    <div className="px-6 lg:px-10 py-8 space-y-6 max-w-7xl">
      <Card tone="default" padding="md" radius="card" shadow="e1">
        <div className="space-y-5">
          <div>
            <p className="text-label text-text-muted mb-3">Status</p>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_CHIPS.map((s) => (
                <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-label text-text-muted mb-3">Date</p>
            <div className="flex items-center gap-2 flex-wrap">
              {DATE_CHIPS.map((p) => (
                <Chip key={p.value} active={datePreset === p.value} onClick={() => setDatePreset(p.value)}>
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>

          <Input
            placeholder="Search by bus name or plate…"
            leading={<Search className="h-4 w-4 text-text-tertiary" />}
            value={busSearch}
            onChange={(e) => setBusSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-14">
          <Spinner className="h-7 w-7" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          tone="neutral"
          title="No orders match these filters"
          description="Try a different status or date range."
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <Card tone="default" padding="none" radius="card" shadow="e1" className="overflow-hidden">
          <SectionHeader
            eyebrow="Results"
            title={`${filtered.length} order${filtered.length === 1 ? '' : 's'}`}
            className="px-6 pt-6 mb-2"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead className="bg-surface2 text-text-muted">
                <tr>
                  <th className="text-left px-6 py-3 text-label">Order</th>
                  <th className="text-left px-4 py-3 text-label">Bus</th>
                  <th className="text-left px-4 py-3 text-label">Items</th>
                  <th className="text-right px-4 py-3 text-label">Total</th>
                  <th className="text-left px-4 py-3 text-label">Time</th>
                  <th className="text-left px-6 py-3 text-label">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t border-border-subtle hover:bg-surface2 transition-colors">
                    <td className="px-6 py-4 font-mono text-caption text-text-muted">#{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-4 text-text-primary">{o.bus_name}</td>
                    <td className="px-4 py-4 text-text-tertiary truncate max-w-[280px]">
                      {o.items.map((i) => `${i.menu_item_name} ×${i.quantity}`).join(', ')}
                    </td>
                    <td className="px-4 py-4 text-right text-text-primary font-semibold tabular-nums">₹{o.total_amount}</td>
                    <td className="px-4 py-4 text-text-tertiary text-caption tabular-nums">
                      {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANT[o.status]} size="sm">{STATUS_LABEL[o.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
