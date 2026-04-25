'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, ClipboardList, QrCode, UserRound, type LucideIcon } from 'lucide-react'
import { useJourneyStore } from '@/stores/journey.store'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  match: (p: string) => boolean
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const activeJourney = useJourneyStore((s) => s.activeJourney)
  const menuHref = activeJourney ? `/menu/${activeJourney.restaurant.id}` : '/scan?from=menu'

  const items: NavItem[] = [
    { href: '/home',   label: 'Home',   icon: Home,            match: (p) => p === '/home' },
    { href: menuHref,  label: 'Menu',   icon: UtensilsCrossed, match: (p) => p.startsWith('/menu/') },
    { href: '/scan',   label: 'Scan',   icon: QrCode,          match: (p) => p === '/scan' || p.startsWith('/scan/') },
    { href: '/orders', label: 'Orders', icon: ClipboardList,   match: (p) => p === '/orders' || p.startsWith('/order/') },
    { href: '/profile', label: 'You',   icon: UserRound,       match: (p) => p === '/profile' },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 px-4 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div
        className={cn(
          'mx-auto max-w-md rounded-pill bg-surface/95 backdrop-blur-xl',
          'border border-border shadow-nav',
          'grid grid-cols-5 gap-1 p-1.5',
        )}
      >
        {items.map((item) => {
          const Icon = item.icon
          const active = item.match(pathname)
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 py-2 rounded-pill transition-colors duration-base ease-standard',
                active ? 'bg-primary text-text-on-dark' : 'text-text-tertiary hover:text-text-primary',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-semibold tracking-[0.01em]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
