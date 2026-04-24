'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Dialog, Input, Spinner, Switch, Textarea } from '@/components/ui'
import api from '@/lib/api'
import type { Paginated, Restaurant } from '@/lib/api.types'

interface FormState {
  name: string
  owner_name: string
  phone_number: string
  email: string
  address: string
  fssai_license_number: string
  hygiene_rating: string
  latitude: string
  longitude: string
  is_active: boolean
}

const emptyForm: FormState = {
  name: '',
  owner_name: '',
  phone_number: '+91',
  email: '',
  address: '',
  fssai_license_number: '',
  hygiene_rating: '',
  latitude: '',
  longitude: '',
  is_active: true,
}

export default function RestaurantsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Restaurant | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'restaurants'],
    queryFn: () => api.get<Paginated<Restaurant>>('/restaurants/?page_size=200').then((r) => r.data),
  })

  const restaurants = data?.results ?? []

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(r: Restaurant) {
    setEditing(r)
    setForm({
      name: r.name,
      owner_name: r.owner_name,
      phone_number: r.phone_number,
      email: r.email,
      address: r.address,
      fssai_license_number: r.fssai_license_number,
      hygiene_rating: r.hygiene_rating ?? '',
      latitude: String(r.latitude ?? ''),
      longitude: String(r.longitude ?? ''),
      is_active: r.is_active,
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        owner_name: form.owner_name,
        phone_number: form.phone_number,
        email: form.email,
        address: form.address,
        fssai_license_number: form.fssai_license_number,
        hygiene_rating: form.hygiene_rating || null,
        location: {
          type: 'Point',
          coordinates: [parseFloat(form.longitude) || 0, parseFloat(form.latitude) || 0],
        },
        is_active: form.is_active,
      }
      if (editing) return api.patch(`/restaurants/${editing.id}/`, payload)
      return api.post('/restaurants/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] })
      setDialogOpen(false)
      toast.success(editing ? 'Restaurant updated' : 'Restaurant created')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(e?.response?.data?.error?.message ?? 'Could not save restaurant.')
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="p-6">
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">Restaurants ({restaurants.length})</h2>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add restaurant
          </Button>
        </div>

        {restaurants.length === 0 ? (
          <p className="text-sm text-text-muted py-12 text-center">No restaurants yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Owner</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">FSSAI</th>
                <th className="text-left px-4 py-3">Rating</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-surface2">
                  <td className="px-4 py-3 font-semibold text-text-primary">{r.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.owner_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.phone_number}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{r.fssai_license_number}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.hygiene_rating ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.is_active ? 'success' : 'muted'}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-2 rounded-md text-text-secondary hover:bg-surface hover:text-text-primary"
                      >
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Edit restaurant' : 'New restaurant'}
        className="max-w-lg"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Owner name</label>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Phone *</label>
              <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="+91…" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Address *</label>
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">FSSAI license *</label>
              <Input value={form.fssai_license_number} onChange={(e) => setForm({ ...form, fssai_license_number: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Hygiene rating</label>
              <Input value={form.hygiene_rating} onChange={(e) => setForm({ ...form, hygiene_rating: e.target.value })} placeholder="4.2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Latitude *</label>
              <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="29.0965" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Longitude *</label>
              <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="77.0560" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
            <span className="text-sm text-text-primary">Active</span>
          </div>
          <div className="flex gap-3 justify-end pt-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!form.name.trim() || !form.phone_number.trim()}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
