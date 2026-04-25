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
    <tr className="border-t border-border-subtle hover:bg-surface2 transition-colors">
      <td className="px-6 py-4">
        <p className="text-body font-semibold text-text-primary">{item.name}</p>
        {item.description && (
          <p className="text-caption text-text-muted truncate max-w-md mt-0.5">{item.description}</p>
        )}
      </td>
      <td className="px-4 py-4 text-text-primary tabular-nums">₹{item.price}</td>
      <td className="px-4 py-4 text-text-tertiary tabular-nums">{item.prep_time_minutes} min</td>
      <td className="px-4 py-4"><AvailabilityToggle item={item} /></td>
      <td className="px-6 py-4">
        <div className="flex gap-1 justify-end">
          <Link
            href={`/dashboard/menu/item/${item.id}`}
            className="h-9 w-9 rounded-lg text-text-tertiary hover:bg-surface hover:text-text-primary inline-flex items-center justify-center transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <button
            onClick={() => {
              if (confirm(`Delete ${item.name}?`)) deleteMutation.mutate()
            }}
            className="h-9 w-9 rounded-lg text-text-tertiary hover:bg-error-bg hover:text-error inline-flex items-center justify-center transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </td>
    </tr>
  )
}
