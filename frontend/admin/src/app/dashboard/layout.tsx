'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useAuthStore } from '@/stores/auth.store'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':             'Overview',
  '/dashboard/restaurants': 'Restaurants',
  '/dashboard/operators':   'Bus Operators',
  '/dashboard/routes':      'Routes',
  '/dashboard/buses':       'Buses',
  '/dashboard/assignments': 'Bus–Restaurant Assignments',
  '/dashboard/profile':     'Profile',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated || user?.role !== 'ADMIN') router.replace('/login')
  }, [mounted, isAuthenticated, user, router])

  if (!mounted || !isAuthenticated || user?.role !== 'ADMIN') return null

  const title = PAGE_TITLES[pathname] ?? 'Dashboard'

  return (
    <div className="min-h-screen flex bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} userPhone={user.phone_number} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
