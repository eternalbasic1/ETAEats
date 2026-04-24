'use client'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AvailabilityToggle } from './AvailabilityToggle'
import api from '@/lib/api'
import type { MenuItem } from '@/lib/api.types'

export function MenuItemRow({ item }: { item: MenuItem }) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/restaurants/menu-items/${item.id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Item deleted')
    },
    onError: () => toast.error('Could not delete item.'),
  })

  return (
    <tr className="border-t border-border hover:bg-surface2">
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">{item.name}</p>
        {item.description && (
          <p className="text-xs text-text-muted truncate max-w-sm">{item.description}</p>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">₹{item.price}</td>
      <td className="px-4 py-3 text-sm text-text-secondary">{item.prep_time_minutes} min</td>
      <td className="px-4 py-3"><AvailabilityToggle item={item} /></td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Link
            href={`/dashboard/menu/item/${item.id}`}
            className="p-2 rounded-md text-text-secondary hover:bg-surface hover:text-text-primary"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              if (confirm(`Delete ${item.name}?`)) deleteMutation.mutate()
            }}
            className="p-2 rounded-md text-error hover:bg-error-bg"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
