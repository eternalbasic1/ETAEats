'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DesktopRail } from './DesktopRail'
import { MobileBottomNav } from './MobileBottomNav'
import { useSidebarStore } from '@/stores/sidebar.store'

const HIDE_CHROME_ROUTES = ['/', '/auth']

function shouldHideChrome(pathname: string) {
  return HIDE_CHROME_ROUTES.some((r) => (r === '/' ? pathname === '/' : pathname.startsWith(r)))
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const persistedCollapsed = useSidebarStore((s) => s.collapsed)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])
  const collapsed = hydrated && persistedCollapsed

  if (shouldHideChrome(pathname)) {
    return <main className="min-h-[100dvh] bg-bg">{children}</main>
  }

  return (
    <div
      style={{ ['--rail-width' as string]: collapsed ? '5rem' : '18rem' }}
      className="contents"
    >
      <DesktopRail collapsed={collapsed} />
      <main>{children}</main>
      <MobileBottomNav />
    </div>
  )
}
