'use client'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, Input, Textarea, Switch } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { MenuCategory, MenuItem, Paginated } from '@/lib/api.types'

const schema = z.object({
  name: z.string().min(1, 'Required').max(200),
  description: z.string().max(500).optional().default(''),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid price'),
  prep_time_minutes: z.coerce.number().int().min(1).max(120),
  category: z.coerce.number().nullable().optional(),
  photo_url: z.string().max(500).optional().default(''),
  is_available: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

interface MenuItemFormProps {
  itemId?: number
  defaults?: Partial<FormValues>
}

export function MenuItemForm({ itemId, defaults }: MenuItemFormProps) {
  const router = useRouter()
  const { restaurantId } = useAuthStore()

  const categoriesQ = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () =>
      api.get<Paginated<MenuCategory>>('/restaurants/menu-categories/?page_size=100').then((r) => r.data.results),
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      prep_time_minutes: 10,
      category: null,
      photo_url: '',
      is_available: true,
      ...defaults,
    },
  })

  const isAvailable = watch('is_available')

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, restaurant: restaurantId }
      if (itemId) return api.patch<MenuItem>(`/restaurants/menu-items/${itemId}/`, payload)
      return api.post<MenuItem>('/restaurants/menu-items/', payload)
    },
    onSuccess: () => {
      toast.success(itemId ? 'Item updated' : 'Item created')
      router.push('/dashboard/menu')
    },
    onError: () => toast.error('Could not save item.'),
  })

  const onSubmit = (values: FormValues) => mutation.mutate(values)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to menu
      </button>

      <Card>
        <h1 className="text-lg font-bold text-text-primary mb-6">
          {itemId ? 'Edit menu item' : 'New menu item'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Name *</label>
            <Input {...register('name')} placeholder="e.g. Dal Makhani" />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Description</label>
            <Textarea {...register('description')} placeholder="Slow-cooked black lentils, butter" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Price (₹) *</label>
              <Input {...register('price')} placeholder="160.00" />
              {errors.price && <p className="text-xs text-error mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Prep time (minutes) *</label>
              <Input type="number" {...register('prep_time_minutes')} min={1} max={120} />
              {errors.prep_time_minutes && <p className="text-xs text-error mt-1">{errors.prep_time_minutes.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Category</label>
            <select
              {...register('category')}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              defaultValue=""
            >
              <option value="">(None)</option>
              {categoriesQ.data?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Photo URL</label>
            <Input {...register('photo_url')} placeholder="https://…" />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isAvailable} onChange={(v) => setValue('is_available', v)} />
            <span className="text-sm text-text-primary">Available</span>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>
              {itemId ? 'Save changes' : 'Create item'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
