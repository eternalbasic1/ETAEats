'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { OTPInput } from '@/components/cart/OTPInput'
import { Button, Spinner } from '@/components/ui'
import { BrandMark } from '@/components/layout/BrandMark'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'

function OTPInner() {
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
    toast.success('Welcome back')
    router.replace('/home')
  }

  async function handleResend() {
    const full = `+91${phone}`
    const ok = await requestOTP(full)
    if (ok) toast.success('OTP resent')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm rounded-card border border-border bg-surface p-6 lg:p-8 shadow-e2"
    >
      <BrandMark size="sm" subtitle="Secure passenger sign-in" />

      <div className="mt-8">
        <p className="text-label text-text-muted">Verify</p>
        <h1 className="mt-3 text-h1 text-text-primary">Enter OTP</h1>
        <p className="mt-2 text-body-sm text-text-tertiary">
          Code sent to <span className="text-text-primary font-medium">+91 {phone}</span>
        </p>
      </div>

      <div className="mt-7">
        <OTPInput value={otp} onChange={setOtp} disabled={loading} />
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-6"
        onClick={handleVerify}
        loading={loading}
        disabled={otp.length < 6}
      >
        Verify & continue
      </Button>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={handleResend}
          disabled={loading}
          className="text-body-sm font-medium text-text-tertiary hover:text-text-primary transition-colors"
        >
          Resend OTP
        </button>
        <Link href="/auth/login" className="text-body-sm font-medium text-text-tertiary hover:text-text-primary transition-colors">
          Change number
        </Link>
      </div>
    </motion.div>
  )
}

export default function OTPPage() {
  return (
    <div className="min-h-[100dvh] bg-bg flex items-center justify-center px-6 py-12">
      <Suspense fallback={<Spinner className="h-7 w-7" />}>
        <OTPInner />
      </Suspense>
    </div>
  )
}
