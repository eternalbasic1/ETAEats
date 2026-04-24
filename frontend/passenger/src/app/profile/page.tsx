'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, LogOut } from 'lucide-react'
import { Button } from '@/components/ui'
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

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-10 bg-bg border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Profile</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="flex flex-col items-center py-4">
          <div className="h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold mb-3">
            {user.full_name ? user.full_name[0]?.toUpperCase() : '👤'}
          </div>
          <p className="text-lg font-bold text-text-primary">
            {user.full_name || 'Passenger'}
          </p>
          <p className="text-sm text-text-secondary">{user.phone_number}</p>
        </div>

        <div className="rounded-xl bg-surface border border-border divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <Phone className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Phone</p>
              <p className="text-sm text-text-primary">{user.phone_number}</p>
            </div>
          </div>
          {user.email && (
            <div className="flex items-center gap-3 p-4">
              <Mail className="h-4 w-4 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Email</p>
                <p className="text-sm text-text-primary">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        <Button variant="danger" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
