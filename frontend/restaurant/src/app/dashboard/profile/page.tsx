'use client'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LogOut, Mail, Phone, Store, Info } from 'lucide-react'
import { Button, Card, Input, SectionHeader, Spinner } from '@/components/ui'
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
  const initial = user?.full_name ? user.full_name[0]?.toUpperCase() : (user?.phone_number ?? '?').slice(-1)

  return (
    <div className="px-6 lg:px-10 py-8 max-w-3xl space-y-6">
      {/* Identity card */}
      <Card tone="powder" padding="lg" radius="card" bordered={false} shadow="e1">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-hero bg-primary text-text-on-dark flex items-center justify-center text-[26px] font-semibold tracking-[-0.02em] shadow-e1">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-label text-accent-ink-powder-blue">Staff</p>
            <p className="mt-1 text-h2 text-text-primary truncate">{user?.full_name || 'Kitchen staff'}</p>
            <p className="text-body-sm text-text-tertiary">{user?.phone_number}</p>
          </div>
        </div>
      </Card>

      {/* Editable profile */}
      <Card tone="default" padding="lg" radius="card" shadow="e1">
        <SectionHeader eyebrow="Account" title="Your profile" description="Used by ETAEats to address you in alerts." />

        <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="space-y-5 mt-6">
          <Input label="Full name" placeholder="Your name" {...register('full_name')} />
          <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} />

          <div className="flex items-center gap-3 rounded-lg bg-surface2 border border-border-subtle px-4 py-3">
            <Phone className="h-4 w-4 text-text-tertiary" strokeWidth={1.8} />
            <div>
              <p className="text-label text-text-muted">Phone (read-only)</p>
              <p className="text-body text-text-primary mt-0.5">{user?.phone_number}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Restaurant info */}
      <Card tone="default" padding="lg" radius="card" shadow="e1">
        <SectionHeader
          eyebrow="Kitchen"
          title="Restaurant details"
          description="Managed by the ETAEats admin team."
          action={
            <span className="h-10 w-10 rounded-lg bg-accent-soft-cream text-accent-ink-soft-cream flex items-center justify-center">
              <Store className="h-4 w-4" strokeWidth={1.8} />
            </span>
          }
        />

        {restaurantQ.isLoading && <Spinner className="h-6 w-6" />}
        {restaurant && (
          <dl className="mt-2 divide-y divide-border-subtle">
            <div className="py-3 flex justify-between items-baseline gap-4 text-body-sm">
              <dt className="text-text-tertiary">Name</dt>
              <dd className="text-text-primary font-semibold text-right">{restaurant.name}</dd>
            </div>
            <div className="py-3 flex justify-between items-baseline gap-4 text-body-sm">
              <dt className="text-text-tertiary">Address</dt>
              <dd className="text-text-primary text-right max-w-sm">{restaurant.address}</dd>
            </div>
            <div className="py-3 flex justify-between items-baseline gap-4 text-body-sm">
              <dt className="text-text-tertiary">Phone</dt>
              <dd className="text-text-primary text-right">{restaurant.phone_number}</dd>
            </div>
            <div className="py-3 flex justify-between items-baseline gap-4 text-body-sm">
              <dt className="text-text-tertiary">FSSAI</dt>
              <dd className="text-text-primary font-mono text-caption text-right">{restaurant.fssai_license_number}</dd>
            </div>
            <div className="py-3 flex justify-between items-baseline gap-4 text-body-sm">
              <dt className="text-text-tertiary">Hygiene rating</dt>
              <dd className="text-text-primary text-right">{restaurant.hygiene_rating ?? '—'}</dd>
            </div>
          </dl>
        )}

        <div className="mt-5 flex items-start gap-3 rounded-lg bg-accent-soft-cream px-4 py-3">
          <Info className="h-4 w-4 mt-0.5 text-accent-ink-soft-cream flex-shrink-0" strokeWidth={1.9} />
          <p className="text-body-sm text-accent-ink-soft-cream leading-snug flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 inline-block" />
            To change restaurant details, contact the ETAEats admin.
          </p>
        </div>
      </Card>

      {/* Sign out */}
      <Card tone="sunk" padding="md" radius="card" bordered shadow="none">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-h4 text-text-primary">Sign out</p>
            <p className="text-body-sm text-text-tertiary mt-0.5">You&rsquo;ll need to enter your phone &amp; OTP again.</p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  )
}
