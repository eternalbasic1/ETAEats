'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart.store'

export function CartBar() {
  const router = useRouter()
  const totalItems = useCartStore((s) => s.totalItems())
  const totalPrice = useCartStore((s) => s.totalPrice())

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-40 p-4"
        >
          <div className="mx-auto w-full max-w-md">
            <button
              onClick={() => router.push('/cart')}
              className="w-full rounded-xl bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 px-5 py-4 flex items-center justify-between"
            >
              <span className="text-sm font-semibold">
                {totalItems} item{totalItems > 1 ? 's' : ''}
              </span>
              <span className="text-sm font-bold">View Cart · ₹{totalPrice.toFixed(0)}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
