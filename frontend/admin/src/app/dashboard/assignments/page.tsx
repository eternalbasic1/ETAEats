'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Card, Input, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { BusRestaurantAssignment, Paginated } from '@/lib/api.types'

export default function AssignmentsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'assignments'],
    queryFn: () =>
      api.get<Paginated<BusRestaurantAssignment>>('/fleet/assignments/?page_size=500').then((r) => r.data.results),
  })

  const assignments = data ?? []

  const filtered = assignments.filter((a) => {
    if (filter === 'active' && !a.is_active) return false
    if (filter === 'inactive' && a.is_active) return false
    if (search) {
      const q = search.toLowerCase()
      if (!a.bus_name.toLowerCase().includes(q) && !a.restaurant_name.toLowerCase().includes(q)) return false
    }
    return true
  })

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="p-6 space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-text-secondary uppercase">Filter:</span>
          {(['active', 'inactive', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'text-xs font-semibold rounded-full px-3 py-1 border transition-colors capitalize',
                filter === f
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-text-secondary border-border hover:border-primary',
              )}
            >
              {f}
            </button>
          ))}
          <Input
            placeholder="Search bus or restaurant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm ml-auto"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">
            Bus ↔ Restaurant ({filtered.length})
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Assignments are created on the Buses page. Only one active assignment per bus is allowed.
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted py-12 text-center">No assignments match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Bus</th>
                <th className="text-left px-4 py-3">Restaurant</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-surface2">
                  <td className="px-4 py-3 font-semibold text-text-primary">{a.bus_name}</td>
                  <td className="px-4 py-3 text-text-primary">{a.restaurant_name}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={a.is_active ? 'success' : 'muted'}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
