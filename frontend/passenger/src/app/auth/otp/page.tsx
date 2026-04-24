'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { OTPInput } from '@/components/cart/OTPInput'
import { Button } from '@/components/ui'
import { BrandMark } from '@/components/layout/BrandMark'
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
    <div className="min-h-screen bg-bg px-6 py-8 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-e2">
        <BrandMark size="sm" subtitle="Secure passenger sign-in" />

        <div className="mt-7">
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight text-text-primary">Verify OTP</h1>
          <p className="text-sm text-text-secondary mt-2">Code sent to +91 {phone}</p>
        </div>

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

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Resend OTP
          </button>
          <Link href="/auth/login" className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
            Change number
          </Link>
        </div>
      </div>
    </div>
  )
}
