'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui'
import { MenuItemForm } from '../new/_form'
import api from '@/lib/api'
import type { MenuItem } from '@/lib/api.types'

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const itemId = parseInt(id)

  const { data, isLoading } = useQuery({
    queryKey: ['menu-item', itemId],
    queryFn: () => api.get<MenuItem>(`/restaurants/menu-items/${itemId}/`).then((r) => r.data),
  })

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <MenuItemForm
      itemId={itemId}
      defaults={{
        name: data.name,
        description: data.description,
        price: data.price,
        prep_time_minutes: data.prep_time_minutes,
        category: data.category,
        photo_url: data.photo_url,
        is_available: data.is_available,
      }}
    />
  )
}
