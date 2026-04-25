'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Button, Input } from '@/components/ui'
import { BrandMark } from '@/components/layout/BrandMark'
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
    <div className="min-h-[100dvh] bg-bg grid lg:grid-cols-2">
      {/* Editorial left panel — desktop only */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-accent-soft-cream">
        <BrandMark size="md" subtitle="Food before you arrive" />
        <div>
          <p className="text-label text-accent-ink-soft-cream">A soft luxury journey</p>
          <h2 className="mt-4 text-display-l text-text-primary">
            Your next meal, served with the hum of the highway.
          </h2>
          <p className="mt-5 text-body-lg text-text-tertiary max-w-md">
            ETAEats quietly coordinates with your bus, the kitchen, and the clock — so food arrives the moment you do.
          </p>
        </div>
        <p className="text-caption text-text-muted">© {new Date().getFullYear()} ETAEats · Made for travellers.</p>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <BrandMark size="lg" />
          </div>

          <div className="rounded-card border border-border bg-surface p-6 lg:p-8 shadow-e2">
            <p className="text-label text-text-muted">Sign in</p>
            <h1 className="mt-3 text-h1 text-text-primary">Welcome back</h1>
            <p className="mt-2 text-body-sm text-text-tertiary">
              Enter your mobile number — we&rsquo;ll send a secure OTP.
            </p>

            <div className="mt-7">
              <Input
                label="Mobile number"
                placeholder="10-digit number"
                inputMode="numeric"
                type="tel"
                leading={<span className="font-medium text-text-secondary">+91</span>}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              onClick={handleContinue}
              loading={loading}
              disabled={phone.length < 10 || loading}
            >
              Continue
            </Button>

            <p className="mt-5 text-caption text-text-muted text-center">
              By continuing you agree to secure OTP verification for your ETAEats account.
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
