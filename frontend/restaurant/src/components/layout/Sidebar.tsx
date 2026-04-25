'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Utensils,
  BarChart3,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar.store'
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
  const persistedCollapsed = useSidebarStore((s) => s.collapsed)
  const toggle = useSidebarStore((s) => s.toggle)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])
  const collapsed = hydrated && persistedCollapsed

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-bg',
        'transition-[width,padding] duration-base ease-standard',
        collapsed ? 'w-20 px-3 py-6' : 'w-72 px-6 py-8',
      )}
    >
      {/* Brand */}
      <div className={cn('flex items-center mb-8', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="h-12 w-12 rounded-lg bg-accent-powder-blue flex items-center justify-center shadow-e1 ring-1 ring-inset ring-white/40 flex-shrink-0">
          <span className="text-[15px] font-semibold text-accent-ink-powder-blue tracking-[-0.02em]">EE</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary leading-none">ETAEats</p>
            <p className="mt-1.5 text-[11px] tracking-[0.06em] uppercase text-text-muted font-semibold truncate">
              {restaurantName ?? 'Kitchen Console'}
            </p>
          </div>
        )}
      </div>

      {/* Toggle */}
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
        {NAV.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
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
            Confirm orders within five minutes of arrival to keep your kitchen sync rate above 90%.
          </p>
        </div>
      )}
    </aside>
  )
}
