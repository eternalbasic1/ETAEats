'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

export default function RootEntryPage() {
  const router = useRouter()
  const { isAuthenticated, hasHydrated } = useAuthStore()

  useEffect(() => {
    if (!hasHydrated) return
    router.replace(isAuthenticated ? '/home' : '/auth/login')
  }, [hasHydrated, isAuthenticated, router])

  return <div className="min-h-screen bg-bg" />
}
