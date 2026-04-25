'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button, Input, Card } from '@/components/ui'
import { OTPInput } from '@/components/login/OTPInput'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, restaurantId } = useAuthStore()
  const { requestOTP, verifyOTP, loading } = useAuth()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && restaurantId) router.replace('/dashboard')
  }, [isAuthenticated, restaurantId, router])

  async function handleSendOTP() {
    setError(null)
    const number = `+91${phone.replace(/\D/g, '')}`
    const ok = await requestOTP(number)
    if (ok) setStep('otp')
  }

  async function handleVerifyOTP() {
    setError(null)
    const number = `+91${phone.replace(/\D/g, '')}`
    const result = await verifyOTP(number, otp)
    if (result.ok) {
      router.replace('/dashboard')
      return
    }
    if (result.reason === 'not_staff') {
      setError('This portal is for restaurant staff only. Passengers should use the ETAEats app from their bus QR.')
    } else if (result.reason === 'no_restaurant') {
      setError('Your account has no restaurant assigned. Contact the admin.')
    } else {
      setError('Invalid OTP. Please try again.')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-bg grid lg:grid-cols-2">
      {/* Editorial left panel */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-accent-soft-cream">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-accent-powder-blue flex items-center justify-center shadow-e1 ring-1 ring-inset ring-white/40">
            <span className="text-[15px] font-semibold text-accent-ink-powder-blue tracking-[-0.02em]">EE</span>
          </div>
          <div>
            <p className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary leading-none">ETAEats</p>
            <p className="mt-1.5 text-[11px] tracking-[0.06em] uppercase text-text-muted font-semibold">
              Kitchen console
            </p>
          </div>
        </div>

        <div>
          <p className="text-label text-accent-ink-soft-cream">Built for highway kitchens</p>
          <h2 className="mt-4 text-display-l text-text-primary">
            Quietly run a busy kitchen.
          </h2>
          <p className="mt-5 text-body-lg text-text-tertiary max-w-md">
            Live orders synced to your buses, calm visuals, and fewer surprises. So your team can focus on the food.
          </p>
        </div>

        <p className="text-caption text-text-muted">© {new Date().getFullYear()} ETAEats · Restaurant portal</p>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-lg bg-accent-powder-blue flex items-center justify-center shadow-e1 ring-1 ring-inset ring-white/40">
              <span className="text-[15px] font-semibold text-accent-ink-powder-blue tracking-[-0.02em]">EE</span>
            </div>
            <div>
              <p className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary leading-none">ETAEats</p>
              <p className="mt-1.5 text-[11px] tracking-[0.06em] uppercase text-text-muted font-semibold">
                Kitchen console
              </p>
            </div>
          </div>

          <Card tone="default" padding="lg" radius="card" shadow="e2">
            {step === 'phone' && (
              <>
                <p className="text-label text-text-muted">Sign in</p>
                <h1 className="mt-3 text-h1 text-text-primary">Welcome back</h1>
                <p className="mt-2 text-body-sm text-text-tertiary">
                  Sign in with your registered staff phone number.
                </p>

                <div className="mt-7">
                  <Input
                    label="Mobile number"
                    placeholder="10-digit number"
                    type="tel"
                    inputMode="numeric"
                    leading={<span className="font-medium text-text-secondary">🇮🇳 +91</span>}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>

                <Button
                  fullWidth
                  size="lg"
                  className="mt-6"
                  onClick={handleSendOTP}
                  loading={loading}
                  disabled={phone.length < 10}
                >
                  Send OTP
                </Button>
              </>
            )}

            {step === 'otp' && (
              <>
                <p className="text-label text-text-muted">Verify</p>
                <h1 className="mt-3 text-h1 text-text-primary">Enter OTP</h1>
                <p className="mt-2 text-body-sm text-text-tertiary">
                  Sent to <span className="text-text-primary font-medium">+91 {phone}</span>
                </p>

                <div className="mt-7">
                  <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                </div>

                {error && (
                  <p className="mt-5 text-body-sm text-error bg-error-bg border border-error-border rounded-lg p-3">
                    {error}
                  </p>
                )}

                <Button
                  fullWidth
                  size="lg"
                  className="mt-6"
                  onClick={handleVerifyOTP}
                  loading={loading}
                  disabled={otp.length < 6}
                >
                  Verify & sign in
                </Button>

                <button
                  onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
                  className="mt-4 w-full text-center text-body-sm font-medium text-text-tertiary hover:text-text-primary transition-colors"
                >
                  Change number
                </button>
              </>
            )}
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
