'use client'
import { useState } from 'react'
import { Dialog, Button, Textarea } from '@/components/ui'

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
    <Dialog open={open} onClose={onClose} title={`Cancel order #${orderShortId}?`}>
      <p className="text-sm text-text-secondary mb-4">
        This cannot be undone. The passenger will be notified and refunded if paid.
      </p>

      <div className="space-y-2 mb-4">
        {REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 p-2 rounded-md hover:bg-surface2 cursor-pointer">
            <input
              type="radio"
              name="reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="accent-primary"
            />
            <span className="text-sm text-text-primary">{r}</span>
          </label>
        ))}
      </div>

      {reason === 'Other' && (
        <Textarea
          value={other}
          onChange={(e) => setOther(e.target.value)}
          placeholder="Tell the passenger why…"
          className="mb-4"
        />
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>Keep order</Button>
        <Button variant="danger" onClick={handleConfirm} loading={submitting}>Cancel order</Button>
      </div>
    </Dialog>
  )
}
