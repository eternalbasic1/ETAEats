'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Switch } from '@/components/ui'
import api from '@/lib/api'
import type { MenuItem } from '@/lib/api.types'

export function AvailabilityToggle({ item }: { item: MenuItem }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (is_available: boolean) =>
      api.patch<MenuItem>(`/restaurants/menu-items/${item.id}/`, { is_available }),
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['menu-items'] })
      const prev = queryClient.getQueryData<MenuItem[]>(['menu-items'])
      if (prev) {
        queryClient.setQueryData<MenuItem[]>(
          ['menu-items'],
          prev.map((i) => (i.id === item.id ? { ...i, is_available: next } : i)),
        )
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['menu-items'], ctx.prev)
      toast.error('Could not update availability.')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['menu-items'] }),
  })

  return <Switch checked={item.is_available} onChange={(v) => mutation.mutate(v)} />
}
