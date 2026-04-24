'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, Dialog, Input, Spinner } from '@/components/ui'
import api from '@/lib/api'
import type { Paginated, Route } from '@/lib/api.types'

interface FormState {
  origin_city: string
  destination_city: string
  distance_km: string
  estimated_duration_hours: string
}

const empty: FormState = {
  origin_city: '', destination_city: '', distance_km: '', estimated_duration_hours: '',
}

export default function RoutesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Route | null>(null)
  const [form, setForm] = useState<FormState>(empty)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'routes'],
    queryFn: () => api.get<Paginated<Route>>('/fleet/routes/?page_size=200').then((r) => r.data),
  })

  const routes = data?.results ?? []

  function openCreate() { setEditing(null); setForm(empty); setDialogOpen(true) }
  function openEdit(r: Route) {
    setEditing(r)
    setForm({
      origin_city: r.origin_city,
      destination_city: r.destination_city,
      distance_km: String(r.distance_km),
      estimated_duration_hours: String(r.estimated_duration_hours),
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        origin_city: form.origin_city,
        destination_city: form.destination_city,
        distance_km: parseInt(form.distance_km) || 0,
        estimated_duration_hours: form.estimated_duration_hours,
      }
      if (editing) return api.patch(`/fleet/routes/${editing.id}/`, payload)
      return api.post('/fleet/routes/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] })
      setDialogOpen(false)
      toast.success(editing ? 'Route updated' : 'Route created')
    },
    onError: () => toast.error('Could not save route.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/fleet/routes/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] })
      toast.success('Route deleted')
    },
    onError: () => toast.error('Could not delete route.'),
  })

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="p-6">
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">Routes ({routes.length})</h2>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Add route</Button>
        </div>

        {routes.length === 0 ? (
          <p className="text-sm text-text-muted py-12 text-center">No routes yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Origin</th>
                <th className="text-left px-4 py-3">Destination</th>
                <th className="text-left px-4 py-3">Distance</th>
                <th className="text-left px-4 py-3">Duration</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-surface2">
                  <td className="px-4 py-3 font-semibold text-text-primary">{r.origin_city}</td>
                  <td className="px-4 py-3 text-text-primary">{r.destination_city}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.distance_km} km</td>
                  <td className="px-4 py-3 text-text-secondary">~{r.estimated_duration_hours}h</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="p-2 rounded-md text-text-secondary hover:bg-surface hover:text-text-primary">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete route ${r.origin_city} → ${r.destination_city}?`)) deleteMutation.mutate(r.id) }}
                        className="p-2 rounded-md text-error hover:bg-error-bg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit route' : 'New route'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Origin *</label>
              <Input value={form.origin_city} onChange={(e) => setForm({ ...form, origin_city: e.target.value })} placeholder="Delhi" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Destination *</label>
              <Input value={form.destination_city} onChange={(e) => setForm({ ...form, destination_city: e.target.value })} placeholder="Chandigarh" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Distance (km) *</label>
              <Input type="number" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} placeholder="265" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Duration (hours) *</label>
              <Input value={form.estimated_duration_hours} onChange={(e) => setForm({ ...form, estimated_duration_hours: e.target.value })} placeholder="4.5" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!form.origin_city.trim() || !form.destination_city.trim()}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
