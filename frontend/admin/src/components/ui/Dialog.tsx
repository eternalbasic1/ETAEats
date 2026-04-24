'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  className?: string
  children: React.ReactNode
}

export function Dialog({ open, onClose, title, className, children }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-surface border border-border shadow-xl p-6',
              className,
            )}
          >
            {title && (
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-surface -mx-6 px-6 pt-0 pb-3 border-b border-border">
                <h2 className="text-lg font-bold text-text-primary">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
