'use client'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui'

export default function OrderCompletePage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="mb-8 flex h-20 w-20 items-center justify-center rounded-hero bg-accent-muted-mint"
      >
        <PartyPopper className="h-9 w-9 text-accent-ink-muted-mint" strokeWidth={1.7} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <p className="text-label text-text-muted">All done</p>
        <h1 className="mt-2 text-h1 text-text-primary">Enjoy your meal</h1>
        <p className="mt-3 text-body text-text-tertiary">
          Order #{(orderId as string).slice(0, 8)} picked up successfully.
        </p>
        <p className="mt-1 text-body-sm text-text-muted">Safe travels.</p>

        <Button variant="secondary" fullWidth className="mt-8" onClick={() => router.push('/orders')}>
          View order history
        </Button>
      </motion.div>
    </div>
  )
}
