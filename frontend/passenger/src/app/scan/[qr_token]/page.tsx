'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Utensils, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useSessionStore } from '@/stores/session.store'
import api from '@/lib/api'
import type { BusScanResult } from '@/lib/api.types'

export default function ScanPage() {
  const router = useRouter()
  const { qr_token } = useParams<{ qr_token: string }>()
  const { setSession } = useSessionStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!qr_token) return

    api.get<BusScanResult>(`/restaurants/scan/${qr_token}/`)
      .then(({ data }) => {
        if (!data.restaurant) {
          router.replace('/scan/no-restaurant')
          return
        }
        setSession(
          qr_token,
          {
            id: data.bus.id,
            name: data.bus.name,
            numberPlate: data.bus.number_plate,
          },
          {
            id: data.restaurant.id,
            name: data.restaurant.name,
            address: data.restaurant.address,
            hygieneRating: data.restaurant.hygiene_rating,
          },
        )
        router.replace(`/menu/${data.restaurant.id}`)
      })
      .catch(() => setError('This QR code is invalid or has expired.'))
  }, [qr_token, router, setSession])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!error ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className="text-center"
          >
            <motion.div
              className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-primary mx-auto mb-8"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(124,92,252,0.3)',
                  '0 0 60px rgba(124,92,252,0.6)',
                  '0 0 20px rgba(124,92,252,0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Utensils className="h-14 w-14 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">ETA Eats</h1>
            <div className="flex items-center justify-center gap-2 text-text-secondary">
              <Spinner className="h-4 w-4" />
              <span className="text-sm">Loading your menu…</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/20 mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-error" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Invalid QR Code</h2>
            <p className="text-text-secondary text-sm mb-6">{error}</p>
            <p className="text-text-muted text-xs">Scan the QR code pasted inside your bus.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
