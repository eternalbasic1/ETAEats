'use client'
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, Button, Input } from '@/components/ui'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import type { MenuCategory } from '@/lib/api.types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: MenuCategory | null
}

export function CategoryFormDialog({ open, onClose, editing }: Props) {
  const { restaurantId } = useAuthStore()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('0')

  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setSortOrder(String(editing.sort_order))
    } else {
      setName('')
      setSortOrder('0')
    }
  }, [editing, open])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { restaurant: restaurantId, name, sort_order: parseInt(sortOrder) || 0 }
      if (editing) {
        return api.patch<MenuCategory>(`/restaurants/menu-categories/${editing.id}/`, payload)
      }
      return api.post<MenuCategory>('/restaurants/menu-categories/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      onClose()
      toast.success(editing ? 'Category updated' : 'Category created')
    },
    onError: () => toast.error('Could not save category.'),
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit category' : 'New category'}
      description="Categories appear as filter chips on the passenger menu."
    >
      <div className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main course"
        />
        <Input
          label="Sort order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          hint="Lower numbers appear first."
        />
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!name.trim()}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
