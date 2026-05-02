'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'

interface CartBarProps {
  visible?: boolean
}

export function CartBar({ visible = true }: CartBarProps) {
  const router = useRouter()
  const totalItems = useCartStore((s) => s.totalItems())
  const totalPrice = useCartStore((s) => s.totalPrice())

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: visible ? 0 : 92, opacity: visible ? 1 : 0 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mobile-floating-cta pointer-events-none px-4 lg:pr-10 lg:pl-[calc(var(--rail-width,18rem)+4rem)] xl:pl-[calc(var(--rail-width,18rem)+5rem)]"
        >
          <div className={`mx-auto w-full max-w-md lg:max-w-3xl ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
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
