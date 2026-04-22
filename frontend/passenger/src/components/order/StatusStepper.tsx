import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/api.types'

const STEPS: {
  status: OrderStatus
  label: string
  emoji: string
  message: string
}[] = [
  {
    status: 'PENDING',
    label: 'Order Placed',
    emoji: '🧾',
    message: 'We received your order.',
  },
  {
    status: 'CONFIRMED',
    label: 'Confirmed',
    emoji: '✅',
    message: 'Restaurant confirmed your order.',
  },
  {
    status: 'PREPARING',
    label: 'Preparing',
    emoji: '🍳',
    message: 'Kitchen is cooking your food.',
  },
  {
    status: 'READY',
    label: 'Ready for Pickup',
    emoji: '🔔',
    message: 'Your food is ready — head to the counter!',
  },
  {
    status: 'PICKED_UP',
    label: 'Picked Up',
    emoji: '🎉',
    message: 'Enjoy your meal!',
  },
]

const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY: 3,
  PICKED_UP: 4,
  CANCELLED: -1,
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
      case 'PENDING':
        return timestamps.created_at
      case 'CONFIRMED':
        return timestamps.confirmed_at
      case 'READY':
        return timestamps.ready_at
      case 'PICKED_UP':
        return timestamps.picked_up_at
      default:
        return null
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-surface2" />

      {STEPS.map((step) => {
        const rank = STATUS_RANK[step.status] ?? 0
        const isDone = rank < currentRank
        const isActive = rank === currentRank
        const isPending = rank > currentRank
        const ts = getTimestamp(step.status)

        return (
          <div
            key={step.status}
            className={cn('relative flex gap-4 mb-6 last:mb-0', isPending && 'opacity-40')}
          >
            <div className="absolute -left-8 flex items-center justify-center">
              {isDone ? (
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              ) : isActive ? (
                <motion.div
                  className="h-7 w-7 rounded-full bg-gradient-primary shadow-lg shadow-primary/50"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-surface2 border-2 border-white/10" />
              )}
            </div>

            <div
              className={cn(
                'flex-1 rounded-xl p-3',
                isActive && 'bg-primary/10 border border-primary/30',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{step.emoji}</span>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isActive
                      ? 'text-text-primary'
                      : isDone
                        ? 'text-primary-soft'
                        : 'text-text-muted',
                  )}
                >
                  {step.label}
                </span>
                {ts && (
                  <span className="ml-auto text-xs text-text-muted">{formatTime(ts)}</span>
                )}
              </div>
              {isActive && (
                <p className="text-xs text-text-secondary mt-1">{step.message}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
