'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const { requestOTP, loading } = useAuth()

  useEffect(() => {
    if (!hasHydrated) return
    if (isAuthenticated) router.replace('/home')
  }, [hasHydrated, isAuthenticated, router])

  async function handleContinue() {
    const normalized = phone.replace(/\D/g, '').slice(0, 10)
    if (normalized.length !== 10) return
    const ok = await requestOTP(`+91${normalized}`)
    if (!ok) return
    toast.success('OTP sent')
    router.push(`/auth/otp?phone=${normalized}`)
  }

  return (
    <div className="min-h-screen bg-bg p-6 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5">
        <h1 className="text-xl font-bold text-text-primary">Welcome to ETA Eats</h1>
        <p className="text-sm text-text-secondary mt-1">Login with your mobile number</p>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-border px-4 py-3 bg-surface2">
          <span className="text-sm text-text-secondary">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit number"
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>

        <Button
          className="w-full mt-4"
          onClick={handleContinue}
          loading={loading}
          disabled={phone.length < 10 || loading}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
