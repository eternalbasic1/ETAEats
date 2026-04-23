'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat } from 'lucide-react'
import { Button, Card } from '@/components/ui'
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
      setError('This portal is for restaurant staff only. Passengers should use the ETA Eats app from their bus QR.')
    } else if (result.reason === 'no_restaurant') {
      setError('Your account has no restaurant assigned. Contact the admin.')
    } else {
      setError('Invalid OTP. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="h-11 w-11 rounded-md bg-primary flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-text-primary">ETA Eats</p>
            <p className="text-xs text-text-secondary">Restaurant Portal</p>
          </div>
        </div>

        <Card className="p-6">
          {step === 'phone' && (
            <>
              <h1 className="text-xl font-bold text-text-primary mb-1">Welcome back</h1>
              <p className="text-sm text-text-secondary mb-6">Sign in with your phone number</p>
              <div className="space-y-4">
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-surface">
                  <span className="text-sm text-text-secondary">🇮🇳 +91</span>
                  <div className="w-px h-4 bg-border" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSendOTP}
                  loading={loading}
                  disabled={phone.length < 10}
                >
                  Send OTP
                </Button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="text-xl font-bold text-text-primary mb-1">Enter OTP</h1>
              <p className="text-sm text-text-secondary mb-6">Sent to +91 {phone}</p>
              <div className="space-y-5">
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                {error && (
                  <p className="text-sm text-error bg-error-bg border border-error/30 rounded-md p-3">
                    {error}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={handleVerifyOTP}
                  loading={loading}
                  disabled={otp.length < 6}
                >
                  Verify &amp; Sign In
                </Button>
                <button
                  onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
                  className="w-full text-center text-xs text-text-secondary"
                >
                  Change number
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
