'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShieldCheck,
  LayoutDashboard,
  Store,
  Building2,
  Route as RouteIcon,
  Bus as BusIcon,
  Link2,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',              label: 'Overview',    icon: LayoutDashboard },
  { href: '/dashboard/restaurants',  label: 'Restaurants', icon: Store },
  { href: '/dashboard/operators',    label: 'Operators',   icon: Building2 },
  { href: '/dashboard/routes',       label: 'Routes',      icon: RouteIcon },
  { href: '/dashboard/buses',        label: 'Buses',       icon: BusIcon },
  { href: '/dashboard/assignments',  label: 'Assignments', icon: Link2 },
  { href: '/dashboard/profile',      label: 'Profile',     icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 bg-surface border-r border-border flex flex-col">
      <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
        <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">ETA Eats</p>
          <p className="text-xs text-text-secondary truncate">Admin Platform</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 h-9 px-3 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-soft text-primary'
                  : 'text-text-secondary hover:bg-surface2 hover:text-text-primary',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
