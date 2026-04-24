'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
    else router.replace('/login')
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
