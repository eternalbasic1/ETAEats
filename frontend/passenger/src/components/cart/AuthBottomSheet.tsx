'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OTPInput } from './OTPInput'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

interface AuthBottomSheetProps {
  open: boolean
  onSuccess: () => void
  onClose: () => void
}

type Step = 'phone' | 'otp'

export function AuthBottomSheet({ open, onSuccess, onClose }: AuthBottomSheetProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const { requestOTP, verifyOTP, loading } = useAuth()

  async function handleSendOTP() {
    const number = `+91${phone.replace(/\D/g, '')}`
    const ok = await requestOTP(number)
    if (ok) setStep('otp')
  }

  async function handleVerifyOTP() {
    const number = `+91${phone.replace(/\D/g, '')}`
    const ok = await verifyOTP(number, otp)
    if (ok) onSuccess()
  }

  function handleClose() {
    setStep('phone')
    setPhone('')
    setOtp('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-hero border-t border-border shadow-modal px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
          >
            <div className="w-10 h-1 bg-border-strong rounded-full mx-auto mb-6" />

            {step === 'phone' && (
              <div>
                <p className="text-label text-text-muted">Almost there</p>
                <h2 className="mt-2 text-h2 text-text-primary">Sign in to place your order</h2>
                <p className="mt-2 text-body-sm text-text-tertiary">Your cart is saved. We&rsquo;ll send you a secure OTP.</p>

                <div className="mt-6">
                  <Input
                    label="Mobile number"
                    placeholder="10-digit number"
                    inputMode="numeric"
                    type="tel"
                    leading={<span className="font-medium text-text-secondary">🇮🇳 +91</span>}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>

                <Button
                  fullWidth
                  size="lg"
                  className="mt-5"
                  onClick={handleSendOTP}
                  loading={loading}
                  disabled={phone.length < 10}
                >
                  Send OTP
                </Button>
                <p className="mt-4 text-center text-caption text-text-muted">
                  No account needed — just your phone.
                </p>
              </div>
            )}

            {step === 'otp' && (
              <div>
                <p className="text-label text-text-muted">Verify</p>
                <h2 className="mt-2 text-h2 text-text-primary">Enter OTP</h2>
                <p className="mt-2 text-body-sm text-text-tertiary">Sent to +91 {phone}</p>
                <div className="mt-6">
                  <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                </div>
                <Button
                  fullWidth
                  size="lg"
                  className="mt-5"
                  onClick={handleVerifyOTP}
                  loading={loading}
                  disabled={otp.length < 6}
                >
                  Verify & continue
                </Button>
                <button
                  onClick={() => setStep('phone')}
                  className="mt-4 w-full text-center text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
                >
                  Change number
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
