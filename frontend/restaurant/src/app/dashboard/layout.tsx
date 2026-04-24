'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { DashboardContext } from '@/components/layout/DashboardContext'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantSocket } from '@/hooks/useRestaurantSocket'
import { useSoundAlert } from '@/hooks/useSoundAlert'
import type { OrderStatusPayload } from '@/lib/api.types'

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard':            { title: 'Live Orders' },
  '/dashboard/orders':     { title: 'Order History' },
  '/dashboard/menu':       { title: 'Menu Management' },
  '/dashboard/analytics':  { title: 'Analytics' },
  '/dashboard/profile':    { title: 'Profile' },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, restaurantId, restaurantName } = useAuthStore()
  const queryClient = useQueryClient()
  const { enabled: soundEnabled, setEnabled: setSoundEnabled, play: playSound, unlock: unlockSound } = useSoundAlert()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated || !restaurantId) router.replace('/login')
  }, [mounted, isAuthenticated, restaurantId, router])

  const handleWSMessage = (payload: OrderStatusPayload) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    if (payload.event === 'created') {
      toast('New order received', { description: payload.body ?? 'A new order is waiting.' })
      playSound()
    }
  }

  const { connectionState } = useRestaurantSocket({
    onMessage: handleWSMessage,
    enabled: mounted && isAuthenticated && !!restaurantId,
  })

  // Unlock audio on first user interaction anywhere in the dashboard.
  useEffect(() => {
    const handler = () => unlockSound()
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  }, [unlockSound])

  if (!mounted || !isAuthenticated || !restaurantId) return null

  const pageMeta = PAGE_TITLES[pathname] ?? (
    pathname.startsWith('/dashboard/menu/item') ? { title: 'Menu Management' } : { title: 'Dashboard' }
  )

  return (
    <DashboardContext.Provider value={{ connectionState }}>
      <div className="min-h-screen flex bg-bg">
        <Sidebar restaurantName={restaurantName} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            title={pageMeta.title}
            subtitle={pageMeta.subtitle}
            connectionState={connectionState}
            soundEnabled={soundEnabled}
            onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </DashboardContext.Provider>
  )
}
