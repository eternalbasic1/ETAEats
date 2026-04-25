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
        await Promise.all(cart.items.map((item) => api.delete(`/orders/cart/items/${item.id}/`)))
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
        const nextBus = { id: data.bus.id, name: data.bus.name, numberPlate: data.bus.number_plate }
        const nextRestaurant = {
          id: data.restaurant.id,
          name: data.restaurant.name,
          address: data.restaurant.address,
          hygieneRating: data.restaurant.hygiene_rating,
        }
        await clearExistingCartForScan()
        clearCart()
        setJourneyFromScan({
          qrToken: qr_token,
          bus: nextBus,
          restaurant: nextRestaurant,
          source: activeJourney ? 'manual' : 'camera',
        })
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
    <div className="min-h-[100dvh] bg-bg flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {!error ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <motion.div
              className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-hero bg-accent-powder-blue"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Utensils className="h-10 w-10 text-accent-ink-powder-blue" strokeWidth={1.6} />
            </motion.div>
            <p className="text-label text-text-muted">Connecting</p>
            <h1 className="mt-3 text-h2 text-text-primary">Preparing your menu</h1>
            <div className="mt-4 inline-flex items-center justify-center gap-2 text-body-sm text-text-tertiary">
              <Spinner className="h-4 w-4" />
              <span>Matching your bus with a highway kitchen…</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-hero bg-error-bg border border-error-border">
              <AlertCircle className="h-7 w-7 text-error" strokeWidth={1.7} />
            </div>
            <h2 className="text-h2 text-text-primary">Invalid QR code</h2>
            <p className="mt-2 text-body-sm text-text-tertiary">{error}</p>
            <p className="mt-4 text-caption text-text-muted">Check the sticker inside your bus and try again.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
