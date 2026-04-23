'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, LayoutDashboard, ClipboardList, Utensils, BarChart3, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',            label: 'Live Orders',     icon: LayoutDashboard },
  { href: '/dashboard/orders',     label: 'Order History',   icon: ClipboardList  },
  { href: '/dashboard/menu',       label: 'Menu',            icon: Utensils       },
  { href: '/dashboard/analytics',  label: 'Analytics',       icon: BarChart3      },
  { href: '/dashboard/profile',    label: 'Profile',         icon: User           },
]

export function Sidebar({ restaurantName }: { restaurantName: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-surface border-r border-border flex flex-col">
      <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
        <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
          <ChefHat className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">ETA Eats</p>
          <p className="text-xs text-text-secondary truncate">{restaurantName ?? 'Restaurant'}</p>
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
