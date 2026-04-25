import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/api.types'

const STEPS: { status: OrderStatus; label: string; message: string }[] = [
  { status: 'PENDING',   label: 'Order placed',      message: 'We received your order.' },
  { status: 'CONFIRMED', label: 'Confirmed',         message: 'Restaurant confirmed your order.' },
  { status: 'PREPARING', label: 'Preparing',         message: 'Kitchen is cooking your food.' },
  { status: 'READY',     label: 'Ready for pickup',  message: 'Your food is ready — head to the counter!' },
  { status: 'PICKED_UP', label: 'Picked up',         message: 'Enjoy your meal!' },
]

const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0, CONFIRMED: 1, PREPARING: 2, READY: 3, PICKED_UP: 4, CANCELLED: -1,
}

interface StatusStepperProps {
  currentStatus: OrderStatus
  timestamps: {
    created_at: string
    confirmed_at: string | null
    ready_at: string | null
    picked_up_at: string | null
  }
}

export function StatusStepper({ currentStatus, timestamps }: StatusStepperProps) {
  const currentRank = STATUS_RANK[currentStatus] ?? 0

  function getTimestamp(status: OrderStatus): string | null {
    switch (status) {
      case 'PENDING':   return timestamps.created_at
      case 'CONFIRMED': return timestamps.confirmed_at
      case 'READY':     return timestamps.ready_at
      case 'PICKED_UP': return timestamps.picked_up_at
      default:          return null
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <ol className="relative pl-9">
      <div className="absolute left-3.5 top-3 bottom-3 w-px bg-border" />
      {STEPS.map((step) => {
        const rank = STATUS_RANK[step.status] ?? 0
        const isDone = rank < currentRank
        const isActive = rank === currentRank
        const isPending = rank > currentRank
        const ts = getTimestamp(step.status)

        return (
          <li key={step.status} className={cn('relative flex gap-4 mb-5 last:mb-0', isPending && 'opacity-50')}>
            <div className="absolute -left-9 top-0 flex items-center justify-center">
              {isDone ? (
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-e1">
                  <Check className="h-3.5 w-3.5 text-text-on-dark" strokeWidth={2.5} />
                </div>
              ) : isActive ? (
                <motion.div
                  className="h-7 w-7 rounded-full bg-primary shadow-cta ring-4 ring-accent-powder-blue"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-surface border-2 border-border-strong" />
              )}
            </div>

            <div
              className={cn(
                'flex-1 rounded-xl py-2 px-3 -mx-1 transition-colors',
                isActive && 'bg-accent-powder-blue',
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-body-sm font-semibold',
                    isActive ? 'text-accent-ink-powder-blue' : isDone ? 'text-text-primary' : 'text-text-muted',
                  )}
                >
                  {step.label}
                </span>
                {ts && <span className="ml-auto text-caption text-text-muted tabular-nums">{formatTime(ts)}</span>}
              </div>
              {isActive && (
                <p className="text-caption text-accent-ink-powder-blue/80 mt-1">{step.message}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
