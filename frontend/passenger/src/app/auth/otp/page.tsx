'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { OTPInput } from '@/components/cart/OTPInput'
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'

export default function OTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const phone = searchParams.get('phone') ?? ''
  const [otp, setOtp] = useState('')
  const { requestOTP, verifyOTP, loading } = useAuth()

  useEffect(() => {
    if (!hasHydrated) return
    if (isAuthenticated) {
      router.replace('/home')
      return
    }
    if (phone.length !== 10) {
      router.replace('/auth/login')
    }
  }, [hasHydrated, isAuthenticated, phone, router])

  async function handleVerify() {
    const full = `+91${phone}`
    const ok = await verifyOTP(full, otp)
    if (!ok) return
    toast.success('Login successful')
    router.replace('/home')
  }

  async function handleResend() {
    const full = `+91${phone}`
    const ok = await requestOTP(full)
    if (ok) toast.success('OTP resent')
  }

  return (
    <div className="min-h-screen bg-bg p-6 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5">
        <h1 className="text-xl font-bold text-text-primary">Verify OTP</h1>
        <p className="text-sm text-text-secondary mt-1">Code sent to +91 {phone}</p>

        <div className="mt-6">
          <OTPInput value={otp} onChange={setOtp} disabled={loading} />
        </div>

        <Button
          className="w-full mt-5"
          onClick={handleVerify}
          loading={loading}
          disabled={otp.length < 6}
        >
          Verify & Continue
        </Button>

        <button
          onClick={handleResend}
          disabled={loading}
          className="text-xs text-text-secondary mt-3 w-full text-center"
        >
          Resend OTP
        </button>
      </div>
    </div>
  )
}
