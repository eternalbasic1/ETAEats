'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ShoppingBag, ArrowRight } from 'lucide-react'
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
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="fixed bottom-24 lg:bottom-8 inset-x-0 z-40 px-4 lg:px-10 pointer-events-none"
        >
          <div className="mx-auto w-full max-w-md lg:max-w-3xl pointer-events-auto">
            <button
              onClick={() => router.push('/cart')}
              className="group w-full rounded-card bg-primary text-text-on-dark shadow-cta
                         px-5 py-4 flex items-center gap-4 transition-transform duration-base ease-standard
                         hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <span className="h-10 w-10 rounded-pill bg-white/10 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <span className="flex-1 text-left">
                <span className="block text-caption uppercase tracking-[0.08em] text-white/60">
                  {totalItems} item{totalItems > 1 ? 's' : ''} · ready to review
                </span>
                <span className="block text-[15px] font-semibold mt-0.5">
                  View cart · ₹{totalPrice.toFixed(0)}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
