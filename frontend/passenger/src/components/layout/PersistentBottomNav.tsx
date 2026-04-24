'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from './BottomNav'

export function PersistentBottomNav() {
  const pathname = usePathname()

  if (pathname === '/' || pathname.startsWith('/auth')) {
    return null
  }

  return <BottomNav />
}
