'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, ClipboardList, QrCode, UserRound } from 'lucide-react'
import { useJourneyStore } from '@/stores/journey.store'

export function BottomNav() {
  const pathname = usePathname()
  const activeJourney = useJourneyStore((s) => s.activeJourney)
  const menuHref = activeJourney ? `/menu/${activeJourney.restaurant.id}` : '/scan?from=menu'

  const links = [
    { href: '/home', label: 'Home', icon: Home, active: pathname === '/home' },
    { href: menuHref, label: 'Menu', icon: UtensilsCrossed, active: pathname.startsWith('/menu/') },
    { href: '/orders', label: 'Orders', icon: ClipboardList, active: pathname === '/orders' || pathname.startsWith('/order/') },
    { href: '/scan', label: 'Scan', icon: QrCode, active: pathname === '/scan' || pathname.startsWith('/scan/') },
    { href: '/profile', label: 'Profile', icon: UserRound, active: pathname === '/profile' },
  ]

  return (
    <div className="fixed inset-x-0 bottom-4 px-4 z-40">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface shadow-md p-3 grid grid-cols-5 gap-2">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`text-xs text-center flex items-center justify-center gap-1 ${item.active ? 'text-primary font-semibold' : 'text-text-secondary'}`}
            >
              <Icon className="h-3.5 w-3.5" /> {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
