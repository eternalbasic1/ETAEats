'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, Utensils, BarChart3, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { href: '/dashboard',           label: 'Live Orders',   icon: LayoutDashboard },
  { href: '/dashboard/orders',    label: 'Order History', icon: ClipboardList   },
  { href: '/dashboard/menu',      label: 'Menu',          icon: Utensils        },
  { href: '/dashboard/analytics', label: 'Analytics',     icon: BarChart3       },
  { href: '/dashboard/profile',   label: 'Profile',       icon: User            },
]

export function Sidebar({ restaurantName }: { restaurantName: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-72 flex-col border-r border-border bg-bg px-6 py-8">
      <div className="px-2 mb-10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-accent-powder-blue flex items-center justify-center shadow-e1 ring-1 ring-inset ring-white/40">
            <span className="text-[15px] font-semibold text-accent-ink-powder-blue tracking-[-0.02em]">EE</span>
          </div>
          <div className="min-w-0">
            <p className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary leading-none">ETAEats</p>
            <p className="mt-1.5 text-[11px] tracking-[0.06em] uppercase text-text-muted font-semibold truncate">
              {restaurantName ?? 'Kitchen Console'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 h-12 px-4 rounded-lg transition-all duration-base ease-standard',
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
          Confirm orders within five minutes of arrival to keep your kitchen sync rate above 90%.
        </p>
      </div>
    </aside>
  )
}
