'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OTPInput } from './OTPInput'
import { Button } from '@/components/ui'
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-2xl border-t border-white/8 p-6"
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            {step === 'phone' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-text-primary">Almost there!</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Sign in to place your order. Your cart is saved.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-surface2 rounded-xl border border-white/8 px-4 py-3">
                  <span className="text-sm text-text-secondary">🇮🇳 +91</span>
                  <div className="w-px h-4 bg-white/20" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
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
                <p className="text-center text-xs text-text-muted">
                  No account needed — just your phone
                </p>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-lg font-bold text-text-primary">Enter OTP</p>
                  <p className="text-sm text-text-secondary mt-1">Sent to +91 {phone}</p>
                </div>
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                <Button
                  className="w-full"
                  onClick={handleVerifyOTP}
                  loading={loading}
                  disabled={otp.length < 6}
                >
                  Verify &amp; Continue
                </Button>
                <button
                  onClick={() => setStep('phone')}
                  className="w-full text-center text-xs text-text-secondary"
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
