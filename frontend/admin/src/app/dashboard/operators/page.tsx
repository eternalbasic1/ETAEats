'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Dialog, Input, Spinner, Switch } from '@/components/ui'
import api from '@/lib/api'
import type { BusOperator, Paginated } from '@/lib/api.types'

interface FormState {
  company_name: string
  contact_name: string
  phone_number: string
  email: string
  is_active: boolean
}

const empty: FormState = {
  company_name: '', contact_name: '', phone_number: '+91', email: '', is_active: true,
}

export default function OperatorsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BusOperator | null>(null)
  const [form, setForm] = useState<FormState>(empty)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'operators'],
    queryFn: () => api.get<Paginated<BusOperator>>('/fleet/operators/?page_size=200').then((r) => r.data),
  })

  const operators = data?.results ?? []

  function openCreate() { setEditing(null); setForm(empty); setDialogOpen(true) }
  function openEdit(o: BusOperator) {
    setEditing(o)
    setForm({
      company_name: o.company_name,
      contact_name: o.contact_name,
      phone_number: o.phone_number,
      email: o.email,
      is_active: o.is_active,
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form }
      if (editing) return api.patch(`/fleet/operators/${editing.id}/`, payload)
      return api.post('/fleet/operators/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'operators'] })
      setDialogOpen(false)
      toast.success(editing ? 'Operator updated' : 'Operator created')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(e?.response?.data?.error?.message ?? 'Could not save operator.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/fleet/operators/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'operators'] })
      toast.success('Operator deleted')
    },
    onError: () => toast.error('Could not delete operator.'),
  })

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="p-6">
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">Bus Operators ({operators.length})</h2>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Add operator</Button>
        </div>

        {operators.length === 0 ? (
          <p className="text-sm text-text-muted py-12 text-center">No operators yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-surface2">
                  <td className="px-4 py-3 font-semibold text-text-primary">{o.company_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{o.contact_name || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{o.phone_number}</td>
                  <td className="px-4 py-3 text-text-secondary">{o.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={o.is_active ? 'success' : 'muted'}>{o.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(o)} className="p-2 rounded-md text-text-secondary hover:bg-surface hover:text-text-primary">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete ${o.company_name}?`)) deleteMutation.mutate(o.id) }}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit operator' : 'New operator'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Company name *</label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Contact name</label>
            <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Phone *</label>
              <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="+91…" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Email *</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
            <span className="text-sm text-text-primary">Active</span>
          </div>
          <div className="flex gap-3 justify-end pt-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!form.company_name.trim() || !form.phone_number.trim() || !form.email.trim()}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
