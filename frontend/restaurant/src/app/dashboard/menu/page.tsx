'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, Spinner } from '@/components/ui'
import { MenuItemRow } from '@/components/menu/MenuItemRow'
import { CategoryFormDialog } from '@/components/menu/CategoryFormDialog'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { MenuCategory, MenuItem, Paginated } from '@/lib/api.types'

export default function MenuPage() {
  const { restaurantId } = useAuthStore()
  const queryClient = useQueryClient()
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null)

  const categoriesQ = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () =>
      api.get<Paginated<MenuCategory>>('/restaurants/menu-categories/?page_size=100').then((r) => r.data.results),
  })

  const itemsQ = useQuery({
    queryKey: ['menu-items'],
    queryFn: () =>
      api
        .get<Paginated<MenuItem>>(`/restaurants/menu-items/?restaurant=${restaurantId}&page_size=200`)
        .then((r) => r.data.results),
    enabled: !!restaurantId,
  })

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/restaurants/menu-categories/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      toast.success('Category deleted')
    },
    onError: () => toast.error('Could not delete category.'),
  })

  const categories = categoriesQ.data ?? []
  const items = itemsQ.data ?? []

  const itemsByCategory = new Map<number | null, MenuItem[]>()
  for (const item of items) {
    const key = item.category
    if (!itemsByCategory.has(key)) itemsByCategory.set(key, [])
    itemsByCategory.get(key)!.push(item)
  }

  if (categoriesQ.isLoading || itemsQ.isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Categories */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-text-primary">Categories</h2>
          <Button
            size="sm"
            onClick={() => { setEditingCat(null); setCatDialogOpen(true) }}
          >
            <Plus className="h-4 w-4" /> New category
          </Button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            No categories yet. Create one to start organising your menu.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="inline-flex items-center gap-1 rounded-md bg-surface2 border border-border pl-3 pr-1 py-1">
                <span className="text-sm font-medium text-text-primary">{cat.name}</span>
                <span className="text-xs text-text-muted">({itemsByCategory.get(cat.id)?.length ?? 0})</span>
                <button
                  onClick={() => { setEditingCat(cat); setCatDialogOpen(true) }}
                  className="p-1 text-text-muted hover:text-primary"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${cat.name}"? Items in this category will become uncategorised.`)) {
                      deleteCatMutation.mutate(cat.id)
                    }
                  }}
                  className="p-1 text-text-muted hover:text-error"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Items */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">Menu items</h2>
          <Link href="/dashboard/menu/item/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add item
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-text-muted py-12 text-center">
            No menu items yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Prep</th>
                <th className="text-left px-4 py-3">Available</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => <MenuItemRow key={item.id} item={item} />)}
            </tbody>
          </table>
        )}
      </Card>

      <CategoryFormDialog
        open={catDialogOpen}
        onClose={() => setCatDialogOpen(false)}
        editing={editingCat}
      />
    </div>
  )
}
