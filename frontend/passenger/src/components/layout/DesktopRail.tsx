'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  UtensilsCrossed,
  ClipboardList,
  QrCode,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react'
import { useJourneyStore } from '@/stores/journey.store'
import { useSidebarStore } from '@/stores/sidebar.store'
import { BrandMark } from './BrandMark'
import { cn } from '@/lib/utils'

interface RailItem {
  href: string
  label: string
  icon: LucideIcon
  match: (p: string) => boolean
}

interface DesktopRailProps {
  collapsed: boolean
}

export function DesktopRail({ collapsed }: DesktopRailProps) {
  const pathname = usePathname()
  const activeJourney = useJourneyStore((s) => s.activeJourney)
  const toggle = useSidebarStore((s) => s.toggle)
  const menuHref = activeJourney ? `/menu/${activeJourney.restaurant.id}` : '/scan?from=menu'

  const items: RailItem[] = [
    { href: '/home',    label: 'Home',    icon: Home,            match: (p) => p === '/home' },
    { href: menuHref,   label: 'Menu',    icon: UtensilsCrossed, match: (p) => p.startsWith('/menu/') },
    { href: '/scan',    label: 'Scan QR', icon: QrCode,          match: (p) => p === '/scan' || p.startsWith('/scan/') },
    { href: '/orders',  label: 'Orders',  icon: ClipboardList,   match: (p) => p === '/orders' || p.startsWith('/order/') },
    { href: '/profile', label: 'Profile', icon: UserRound,       match: (p) => p === '/profile' },
  ]

  return (
    <aside
      style={{ width: 'var(--rail-width, 18rem)' }}
      className={cn(
        'hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-border bg-bg',
        'transition-[width] duration-base ease-standard',
        collapsed ? 'px-3 py-6' : 'px-6 py-8',
      )}
    >
      {/* Brand + toggle */}
      <div className={cn('flex items-center mb-8', collapsed ? 'justify-center' : 'justify-between')}>
        {collapsed ? (
          <BrandMark size="md" compact />
        ) : (
          <div className="px-2">
            <BrandMark size="md" subtitle="Food before you arrive" />
          </div>
        )}
      </div>

      <button
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'group relative flex items-center mb-4 rounded-lg transition-all duration-base ease-standard',
          'text-text-tertiary hover:bg-surface hover:text-text-primary',
          collapsed ? 'h-10 w-full justify-center' : 'h-9 px-3 self-end',
        )}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.8} />
        ) : (
          <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.8} />
        )}
        {collapsed && (
          <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-primary text-text-on-dark text-[12px] font-medium whitespace-nowrap shadow-cta opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-base ease-standard pointer-events-none z-50">
            Expand
          </span>
        )}
      </button>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.match(pathname)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group relative flex items-center h-12 rounded-lg transition-all duration-base ease-standard',
                active
                  ? 'bg-primary text-text-on-dark shadow-e1'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary',
                collapsed ? 'justify-center px-0' : 'gap-3 px-4',
              )}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={active ? 2.1 : 1.8} />
              {!collapsed && <span className="text-[14px] font-semibold">{item.label}</span>}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span
                  className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-primary text-text-on-dark text-[12px] font-medium tracking-[-0.005em] whitespace-nowrap
                             shadow-cta opacity-0 invisible
                             group-hover:opacity-100 group-hover:visible
                             transition-all duration-base ease-standard pointer-events-none z-50"
                >
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Tip card — expanded only */}
      {!collapsed && (
        <div className="mt-auto rounded-card bg-accent-soft-cream p-5">
          <p className="text-label text-accent-ink-soft-cream">Tip</p>
          <p className="mt-2 text-body-sm text-text-primary leading-snug">
            Scan the QR sticker inside your bus to start ordering. Your menu updates automatically for your route.
          </p>
        </div>
      )}
    </aside>
  )
}
