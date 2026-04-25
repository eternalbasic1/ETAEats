'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Mail, LogOut, Shield, Info } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const { logout } = useAuth()

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) router.replace('/auth/login')
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated || !isAuthenticated || !user) return null

  async function handleLogout() {
    await logout()
    router.replace('/auth/login')
  }

  const initial = user.full_name ? user.full_name[0]?.toUpperCase() : user.phone_number.slice(-1)

  return (
    <div className="app-shell slux-fade-in">
      <div className="app-shell-inner lg:pt-10">
        <TopBar title="Your profile" onBack={() => router.back()} />

        <div className="pb-16 space-y-5">
          {/* Identity card */}
          <Card tone="powder" padding="lg" radius="card" bordered={false} shadow="e1">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-hero bg-primary text-text-on-dark flex items-center justify-center text-[26px] font-semibold tracking-[-0.02em] shadow-e1">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-label text-accent-ink-powder-blue">Passenger</p>
                <p className="mt-1 text-h2 text-text-primary truncate">{user.full_name || 'Traveller'}</p>
                <p className="text-body-sm text-text-tertiary">{user.phone_number}</p>
              </div>
            </div>
          </Card>

          <Card tone="default" padding="none" radius="card" shadow="e1">
            <div className="divide-y divide-border-subtle">
              <div className="flex items-center gap-4 p-5">
                <span className="h-10 w-10 rounded-lg bg-surface2 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-text-tertiary" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="text-label text-text-muted">Phone</p>
                  <p className="text-body text-text-primary mt-0.5">{user.phone_number}</p>
                </div>
              </div>
              {user.email && (
                <div className="flex items-center gap-4 p-5">
                  <span className="h-10 w-10 rounded-lg bg-surface2 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-text-tertiary" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-label text-text-muted">Email</p>
                    <p className="text-body text-text-primary mt-0.5">{user.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 p-5">
                <span className="h-10 w-10 rounded-lg bg-surface2 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-text-tertiary" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="text-label text-text-muted">Security</p>
                  <p className="text-body text-text-primary mt-0.5">OTP-based sign in</p>
                </div>
              </div>
            </div>
          </Card>

          <Card tone="elevated" padding="md" radius="card" bordered={false} shadow="none">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-accent-ink-soft-cream mt-1 flex-shrink-0" strokeWidth={1.9} />
              <p className="text-body-sm text-accent-ink-soft-cream leading-relaxed">
                ETAEats never stores your bus ticket or payment details. We only need your phone to confirm pickup.
              </p>
            </div>
          </Card>

          <Button variant="secondary" fullWidth onClick={handleLogout}>
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
