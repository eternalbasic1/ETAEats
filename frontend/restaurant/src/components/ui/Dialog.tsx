'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './IconButton'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const sizes: Record<NonNullable<DialogProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Dialog({ open, onClose, title, description, className, size = 'md', children }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className={cn(
              'relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-card bg-surface border border-border shadow-modal p-6',
              sizes[size],
              className,
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="min-w-0">
                  {title && <h2 className="text-h3 text-text-primary">{title}</h2>}
                  {description && <p className="text-body-sm text-text-tertiary mt-1.5">{description}</p>}
                </div>
                <IconButton aria-label="Close dialog" tone="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
