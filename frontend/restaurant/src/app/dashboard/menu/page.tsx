'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, FolderTree, ChefHat } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, EmptyState, SectionHeader, Spinner } from '@/components/ui'
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
    return (
      <div className="flex items-center justify-center pt-20">
        <Spinner className="h-7 w-7" />
      </div>
    )
  }

  return (
    <div className="px-6 lg:px-10 py-8 space-y-8 max-w-6xl">
      {/* Categories */}
      <Card tone="default" padding="lg" radius="card" shadow="e1">
        <SectionHeader
          eyebrow="Organisation"
          title="Categories"
          description="Group your menu items so passengers can browse quickly."
          action={
            <Button
              size="sm"
              onClick={() => { setEditingCat(null); setCatDialogOpen(true) }}
            >
              <Plus className="h-4 w-4" />
              New category
            </Button>
          }
        />

        {categories.length === 0 ? (
          <EmptyState
            tone="cream"
            icon={<FolderTree className="h-6 w-6" strokeWidth={1.7} />}
            title="No categories yet"
            description="Create one to start organising your menu — think Mains, Beverages, Desserts."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="inline-flex items-center gap-2 rounded-pill bg-surface2 border border-border-subtle pl-4 pr-1.5 h-9"
              >
                <span className="text-body-sm font-semibold text-text-primary">{cat.name}</span>
                <span className="text-caption text-text-muted">({itemsByCategory.get(cat.id)?.length ?? 0})</span>
                <button
                  onClick={() => { setEditingCat(cat); setCatDialogOpen(true) }}
                  className="h-7 w-7 rounded-full text-text-muted hover:bg-surface hover:text-text-primary inline-flex items-center justify-center transition-colors"
                  aria-label={`Edit ${cat.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${cat.name}"? Items in this category will become uncategorised.`)) {
                      deleteCatMutation.mutate(cat.id)
                    }
                  }}
                  className="h-7 w-7 rounded-full text-text-muted hover:bg-error-bg hover:text-error inline-flex items-center justify-center transition-colors"
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Items */}
      <Card tone="default" padding="none" radius="card" shadow="e1">
        <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <p className="text-label text-text-muted">Inventory</p>
            <h2 className="text-h3 text-text-primary mt-1.5">Menu items</h2>
          </div>
          <Link href="/dashboard/menu/item/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="px-6 pb-8">
            <EmptyState
              tone="powder"
              icon={<ChefHat className="h-6 w-6" strokeWidth={1.7} />}
              title="No menu items yet"
              description="Add your first dish — passengers will see it the moment they scan."
              action={
                <Link href="/dashboard/menu/item/new">
                  <Button>Add your first item</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead className="bg-surface2 text-text-muted">
                <tr>
                  <th className="text-left px-6 py-3 text-label">Item</th>
                  <th className="text-left px-4 py-3 text-label">Price</th>
                  <th className="text-left px-4 py-3 text-label">Prep</th>
                  <th className="text-left px-4 py-3 text-label">Available</th>
                  <th className="text-right px-6 py-3 text-label">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => <MenuItemRow key={item.id} item={item} />)}
              </tbody>
            </table>
          </div>
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
