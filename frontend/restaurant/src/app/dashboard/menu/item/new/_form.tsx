'use client'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, IconButton, Input, Switch, Textarea } from '@/components/ui'
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
    <div className="px-6 lg:px-10 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <IconButton aria-label="Back" tone="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </IconButton>
        <span className="text-body-sm text-text-tertiary">Back to menu</span>
      </div>

      <Card tone="default" padding="lg" radius="card" shadow="e1">
        <p className="text-label text-text-muted">{itemId ? 'Edit' : 'New'}</p>
        <h1 className="mt-2 text-h2 text-text-primary">{itemId ? 'Edit menu item' : 'New menu item'}</h1>
        <p className="mt-1.5 text-body-sm text-text-tertiary">
          Passengers see this exactly as you write it. Keep names short and prices accurate.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <Input
            label="Name"
            placeholder="e.g. Dal Makhani"
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <span className="block text-label text-text-muted mb-2">Description</span>
            <Textarea {...register('description')} placeholder="Slow-cooked black lentils, butter, cream." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              placeholder="160.00"
              error={errors.price?.message}
              {...register('price')}
            />
            <Input
              label="Prep time (min)"
              type="number"
              min={1}
              max={120}
              error={errors.prep_time_minutes?.message}
              {...register('prep_time_minutes')}
            />
          </div>

          <div>
            <span className="block text-label text-text-muted mb-2">Category</span>
            <select
              {...register('category')}
              className="h-12 w-full rounded-lg border border-border bg-surface px-4 text-body text-text-primary
                         transition-colors duration-base ease-standard
                         focus:border-border-strong focus:outline-none"
              defaultValue=""
            >
              <option value="">(None)</option>
              {categoriesQ.data?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Photo URL"
            placeholder="https://…"
            {...register('photo_url')}
          />

          <div className="flex items-center justify-between rounded-lg bg-surface2 border border-border-subtle px-4 py-3">
            <div>
              <p className="text-body font-semibold text-text-primary">Available</p>
              <p className="text-caption text-text-muted mt-0.5">Toggle off to temporarily hide from passengers</p>
            </div>
            <Switch checked={isAvailable} onChange={(v) => setValue('is_available', v, { shouldDirty: true })} />
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
