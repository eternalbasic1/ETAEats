'use client'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'

export default function OrderCompletePage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-7xl mb-6"
      >
        🎉
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-2">Enjoy your meal!</h1>
        <p className="text-text-secondary text-sm mb-2">
          Order #{(orderId as string).slice(0, 8)} picked up successfully.
        </p>
        <p className="text-text-muted text-xs mb-8">Safe travels!</p>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.push('/orders')}
        >
          View order history
        </Button>
      </motion.div>
    </div>
  )
}
