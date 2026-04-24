'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Utensils, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui'
import { useJourneyStore } from '@/stores/journey.store'
import { useCartStore } from '@/stores/cart.store'
import api from '@/lib/api'
import type { BusScanResult, Cart, Paginated, MenuItem } from '@/lib/api.types'

export default function ScanPage() {
  const router = useRouter()
  const { qr_token } = useParams<{ qr_token: string }>()
  const { setJourneyFromScan, activeJourney } = useJourneyStore()
  const { clearCart } = useCartStore()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!qr_token) return

    async function clearExistingCartForScan() {
      try {
        const { data: cart } = await api.get<Cart>('/orders/cart/')
        if (!cart.items.length) return
        await Promise.all(
          cart.items.map((item) => api.delete(`/orders/cart/items/${item.id}/`))
        )
      } catch {
        throw new Error('Could not clear existing cart.')
      }
    }

    async function run() {
      try {
        const { data } = await api.get<BusScanResult>(`/restaurants/scan/${qr_token}/`)
        if (!data.restaurant) {
          router.replace('/scan/no-restaurant')
          return
        }
        const nextBus = {
            id: data.bus.id,
            name: data.bus.name,
            numberPlate: data.bus.number_plate,
          }
        const nextRestaurant = {
            id: data.restaurant.id,
            name: data.restaurant.name,
            address: data.restaurant.address,
            hygieneRating: data.restaurant.hygiene_rating,
          }

        // Always clear any previous cart for this session/user before binding
        // to the newly scanned QR context.
        await clearExistingCartForScan()
        clearCart()

        setJourneyFromScan({
          qrToken: qr_token,
          bus: nextBus,
          restaurant: nextRestaurant,
          source: activeJourney ? 'manual' : 'camera',
        })
        // Seed the menu query cache so the menu page renders instantly
        // without a second network round-trip.
        if (data.menu.length > 0) {
          const paginated: Paginated<MenuItem> = {
            count: data.menu.length,
            next: null,
            previous: null,
            results: data.menu,
          }
          queryClient.setQueryData(['menu', String(data.restaurant.id)], paginated)
        }
        router.replace(`/menu/${data.restaurant.id}`)
      } catch {
        toast.error('Could not start a fresh cart for this scan. Please try again.')
        setError('This QR code is invalid, expired, or could not be initialized.')
      }
    }

    run()
  }, [qr_token, router, setJourneyFromScan, queryClient, clearCart, activeJourney])

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
              className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary mx-auto mb-8"
              animate={{
                boxShadow: [
                  '0 8px 20px rgba(255,107,43,0.25)',
                  '0 12px 40px rgba(255,107,43,0.45)',
                  '0 8px 20px rgba(255,107,43,0.25)',
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-bg border border-error/30 mx-auto mb-4">
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
