'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Dialog, Input, Spinner, Switch } from '@/components/ui'
import api from '@/lib/api'
import type { Bus, BusOperator, Paginated, Restaurant, Route } from '@/lib/api.types'

interface FormState {
  operator: string
  route: string
  bus_name: string
  number_plate: string
  total_seats: string
  is_active: boolean
}

const empty: FormState = {
  operator: '', route: '', bus_name: '', number_plate: '', total_seats: '40', is_active: true,
}

export default function BusesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Bus | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [assignDialogBus, setAssignDialogBus] = useState<Bus | null>(null)
  const [assignRestaurantId, setAssignRestaurantId] = useState<string>('')

  const busesQ = useQuery({
    queryKey: ['admin', 'buses'],
    queryFn: () => api.get<Paginated<Bus>>('/fleet/buses/?page_size=500').then((r) => r.data.results),
  })
  const operatorsQ = useQuery({
    queryKey: ['admin', 'operators'],
    queryFn: () => api.get<Paginated<BusOperator>>('/fleet/operators/?page_size=200').then((r) => r.data.results),
  })
  const routesQ = useQuery({
    queryKey: ['admin', 'routes'],
    queryFn: () => api.get<Paginated<Route>>('/fleet/routes/?page_size=200').then((r) => r.data.results),
  })
  const restaurantsQ = useQuery({
    queryKey: ['admin', 'restaurants'],
    queryFn: () => api.get<Paginated<Restaurant>>('/restaurants/?page_size=200').then((r) => r.data.results),
  })

  const buses = Array.isArray(busesQ.data) ? busesQ.data : busesQ.data?.results ?? []
  const operators = Array.isArray(operatorsQ.data) ? operatorsQ.data : operatorsQ.data?.results ?? []
  const routes = Array.isArray(routesQ.data) ? routesQ.data : routesQ.data?.results ?? []
  const restaurants = Array.isArray(restaurantsQ.data) ? restaurantsQ.data : restaurantsQ.data?.results ?? []

  function openCreate() { setEditing(null); setForm(empty); setDialogOpen(true) }
  function openEdit(b: Bus) {
    setEditing(b)
    setForm({
      operator: String(b.operator),
      route: b.route ? String(b.route) : '',
      bus_name: b.bus_name,
      number_plate: b.number_plate,
      total_seats: String(b.total_seats),
      is_active: b.is_active,
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        operator: parseInt(form.operator),
        route: form.route ? parseInt(form.route) : null,
        bus_name: form.bus_name,
        number_plate: form.number_plate,
        total_seats: parseInt(form.total_seats) || 0,
        is_active: form.is_active,
      }
      if (editing) return api.patch(`/fleet/buses/${editing.id}/`, payload)
      return api.post('/fleet/buses/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'buses'] })
      setDialogOpen(false)
      toast.success(editing ? 'Bus updated' : 'Bus created')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(e?.response?.data?.error?.message ?? 'Could not save bus.')
    },
  })

  const assignMutation = useMutation({
    mutationFn: () =>
      api.post(`/fleet/buses/${assignDialogBus!.id}/assign_restaurant/`, {
        restaurant: parseInt(assignRestaurantId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignments'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'buses'] })
      setAssignDialogBus(null)
      setAssignRestaurantId('')
      toast.success('Restaurant assigned')
    },
    onError: () => toast.error('Could not assign restaurant.'),
  })

  function copyQR(qr: string) {
    navigator.clipboard.writeText(qr).then(() => toast.success('QR token copied'))
  }

  if (busesQ.isLoading) return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="p-6">
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">Buses ({buses.length})</h2>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Add bus</Button>
        </div>

        {buses.length === 0 ? (
          <p className="text-sm text-text-muted py-12 text-center">No buses yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Plate</th>
                <th className="text-left px-4 py-3">Operator</th>
                <th className="text-left px-4 py-3">Route</th>
                <th className="text-left px-4 py-3">Seats</th>
                <th className="text-left px-4 py-3">QR Token</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-surface2">
                  <td className="px-4 py-3 font-semibold text-text-primary">{b.bus_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{b.number_plate}</td>
                  <td className="px-4 py-3 text-text-secondary">{b.operator_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{b.route_label ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{b.total_seats}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyQR(b.qr_token)}
                      className="inline-flex items-center gap-1 font-mono text-xs text-text-muted hover:text-primary"
                      title="Click to copy"
                    >
                      {b.qr_token.slice(0, 8)}…
                      <Copy className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={b.is_active ? 'success' : 'muted'}>{b.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setAssignDialogBus(b)}
                        className="p-2 rounded-md text-text-secondary hover:bg-surface hover:text-primary"
                        title="Assign restaurant"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(b)} className="p-2 rounded-md text-text-secondary hover:bg-surface hover:text-text-primary">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Bus create/edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit bus' : 'New bus'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Operator *</label>
            <select
              value={form.operator}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">Select operator…</option>
              {operators.map((o) => <option key={o.id} value={o.id}>{o.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Route</label>
            <select
              value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">(None)</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.origin_city} → {r.destination_city}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Name *</label>
              <Input value={form.bus_name} onChange={(e) => setForm({ ...form, bus_name: e.target.value })} placeholder="SRS Express 101" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Number plate *</label>
              <Input value={form.number_plate} onChange={(e) => setForm({ ...form, number_plate: e.target.value })} placeholder="DL-01-AA-0001" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Total seats *</label>
            <Input type="number" value={form.total_seats} onChange={(e) => setForm({ ...form, total_seats: e.target.value })} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
            <span className="text-sm text-text-primary">Active</span>
          </div>
          <div className="flex gap-3 justify-end pt-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!form.bus_name.trim() || !form.number_plate.trim() || !form.operator}
            >
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Assign restaurant dialog */}
      <Dialog
        open={!!assignDialogBus}
        onClose={() => setAssignDialogBus(null)}
        title={`Assign restaurant to ${assignDialogBus?.bus_name}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            This will deactivate any existing active assignment for this bus.
          </p>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Restaurant *</label>
            <select
              value={assignRestaurantId}
              onChange={(e) => setAssignRestaurantId(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">Select restaurant…</option>
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-3">
            <Button variant="ghost" onClick={() => setAssignDialogBus(null)} disabled={assignMutation.isPending}>Cancel</Button>
            <Button onClick={() => assignMutation.mutate()} loading={assignMutation.isPending} disabled={!assignRestaurantId}>
              Assign
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
