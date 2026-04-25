'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, ClipboardList, QrCode, UserRound, type LucideIcon } from 'lucide-react'
import { useJourneyStore } from '@/stores/journey.store'
import { BrandMark } from './BrandMark'
import { cn } from '@/lib/utils'

interface RailItem {
  href: string
  label: string
  icon: LucideIcon
  match: (p: string) => boolean
}

export function DesktopRail() {
  const pathname = usePathname()
  const activeJourney = useJourneyStore((s) => s.activeJourney)
  const menuHref = activeJourney ? `/menu/${activeJourney.restaurant.id}` : '/scan?from=menu'

  const items: RailItem[] = [
    { href: '/home',    label: 'Home',    icon: Home,            match: (p) => p === '/home' },
    { href: menuHref,   label: 'Menu',    icon: UtensilsCrossed, match: (p) => p.startsWith('/menu/') },
    { href: '/scan',    label: 'Scan QR', icon: QrCode,          match: (p) => p === '/scan' || p.startsWith('/scan/') },
    { href: '/orders',  label: 'Orders',  icon: ClipboardList,   match: (p) => p === '/orders' || p.startsWith('/order/') },
    { href: '/profile', label: 'Profile', icon: UserRound,       match: (p) => p === '/profile' },
  ]

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-border bg-bg px-6 py-8">
      <div className="px-2 mb-10">
        <BrandMark size="md" subtitle="Food before you arrive" />
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.match(pathname)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 h-12 px-4 rounded-lg transition-all duration-base ease-standard',
                active
                  ? 'bg-primary text-text-on-dark shadow-e1'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.1 : 1.8} />
              <span className="text-[14px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto rounded-card bg-accent-soft-cream p-5">
        <p className="text-label text-accent-ink-soft-cream">Tip</p>
        <p className="mt-2 text-body-sm text-text-primary leading-snug">
          Scan the QR sticker inside your bus to start ordering. Your menu updates automatically for your route.
        </p>
      </div>
    </aside>
  )
}
