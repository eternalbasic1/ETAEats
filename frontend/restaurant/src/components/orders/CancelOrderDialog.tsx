'use client'
import { useState } from 'react'
import { Dialog, Button, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'

const REASONS = ['Out of stock', 'Kitchen closed', 'Too busy', 'Other']

interface CancelOrderDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void> | void
  orderShortId: string
}

export function CancelOrderDialog({ open, onClose, onConfirm, orderShortId }: CancelOrderDialogProps) {
  const [reason, setReason] = useState(REASONS[0] ?? '')
  const [other, setOther] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    const finalReason = reason === 'Other' ? other.trim() : reason
    if (!finalReason) return
    setSubmitting(true)
    try { await onConfirm(finalReason) } finally { setSubmitting(false) }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Cancel order #${orderShortId}?`}
      description="The passenger will be notified and refunded if paid. This cannot be undone."
    >
      <div className="space-y-2 mb-5">
        {REASONS.map((r) => {
          const selected = reason === r
          return (
            <label
              key={r}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors duration-base ease-standard',
                selected
                  ? 'bg-accent-powder-blue border-transparent'
                  : 'bg-surface border-border hover:border-border-strong',
              )}
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={selected}
                onChange={() => setReason(r)}
                className="h-4 w-4 accent-primary"
              />
              <span className={cn('text-body-sm', selected ? 'text-accent-ink-powder-blue font-semibold' : 'text-text-primary')}>
                {r}
              </span>
            </label>
          )
        })}
      </div>

      {reason === 'Other' && (
        <Textarea
          value={other}
          onChange={(e) => setOther(e.target.value)}
          placeholder="Tell the passenger why…"
          className="mb-5"
        />
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>Keep order</Button>
        <Button variant="danger" onClick={handleConfirm} loading={submitting}>Cancel order</Button>
      </div>
    </Dialog>
  )
}
