'use client'
import { usePathname } from 'next/navigation'
import { DesktopRail } from './DesktopRail'
import { MobileBottomNav } from './MobileBottomNav'

const HIDE_CHROME_ROUTES = ['/', '/auth']

function shouldHideChrome(pathname: string) {
  return HIDE_CHROME_ROUTES.some((r) => (r === '/' ? pathname === '/' : pathname.startsWith(r)))
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bare = shouldHideChrome(pathname)

  if (bare) {
    return <main className="min-h-[100dvh] bg-bg">{children}</main>
  }

  return (
    <>
      {/* Desktop left rail — hidden on mobile */}
      <DesktopRail />
      {/* Primary content */}
      <main>{children}</main>
      {/* Floating bottom nav pill — hidden on ≥lg */}
      <MobileBottomNav />
    </>
  )
}
