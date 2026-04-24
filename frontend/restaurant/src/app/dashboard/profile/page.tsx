'use client'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LogOut, Mail, Phone, Store, User as UserIcon } from 'lucide-react'
import { Button, Card, Input, Spinner } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { Restaurant, User } from '@/lib/api.types'

interface ProfileForm {
  full_name: string
  email: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, restaurantId, refreshToken, updateUser } = useAuthStore()
  const { logout } = useAuth()
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<ProfileForm>({
    defaultValues: { full_name: user?.full_name ?? '', email: user?.email ?? '' },
  })

  const restaurantQ = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => api.get<Restaurant>(`/restaurants/${restaurantId}/`).then((r) => r.data),
    enabled: !!restaurantId,
  })

  const updateMutation = useMutation({
    mutationFn: (values: ProfileForm) => api.patch<User>('/auth/me/', values),
    onSuccess: (response) => {
      updateUser(response.data)
      reset({
        full_name: response.data.full_name ?? '',
        email: response.data.email ?? '',
      })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Profile updated')
    },
    onError: () => toast.error('Could not update profile.'),
  })

  async function handleLogout() {
    await logout(refreshToken)
    router.replace('/login')
  }

  const restaurant = restaurantQ.data

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* User profile */}
      <Card>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center text-primary font-bold">
            {user?.full_name ? user.full_name[0]?.toUpperCase() : <UserIcon className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Your profile</h2>
            <p className="text-xs text-text-secondary">Signed in as {user?.phone_number}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Full name</label>
            <Input {...register('full_name')} placeholder="Your name" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Email</label>
            <Input type="email" {...register('email')} placeholder="you@example.com" />
          </div>

          <div className="flex gap-3">
            <Phone className="h-4 w-4 text-text-muted mt-0.5" />
            <div>
              <p className="text-xs text-text-muted">Phone (can&apos;t be changed)</p>
              <p className="text-sm text-text-primary">{user?.phone_number}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Restaurant info (read-only) */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-text-primary">Restaurant details</h2>
        </div>

        {restaurantQ.isLoading && <Spinner className="h-6 w-6" />}
        {restaurant && (
          <dl className="divide-y divide-border">
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">Name</dt>
              <dd className="text-text-primary font-semibold">{restaurant.name}</dd>
            </div>
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">Address</dt>
              <dd className="text-text-primary text-right max-w-sm">{restaurant.address}</dd>
            </div>
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">Phone</dt>
              <dd className="text-text-primary">{restaurant.phone_number}</dd>
            </div>
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">FSSAI</dt>
              <dd className="text-text-primary font-mono text-xs">{restaurant.fssai_license_number}</dd>
            </div>
            <div className="py-2 flex justify-between text-sm">
              <dt className="text-text-secondary">Hygiene rating</dt>
              <dd className="text-text-primary">{restaurant.hygiene_rating ?? '—'}</dd>
            </div>
          </dl>
        )}

        <p className="text-xs text-text-muted mt-4 flex items-center gap-2">
          <Mail className="h-3 w-3" />
          To change restaurant details, contact the ETA Eats admin.
        </p>
      </Card>

      {/* Sign out */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Sign out</h2>
            <p className="text-xs text-text-secondary">You&apos;ll need to enter your phone &amp; OTP again.</p>
          </div>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </Card>
    </div>
  )
}
