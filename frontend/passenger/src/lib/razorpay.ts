import type { RazorpayOrderPayload } from './api.types'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  prefill: { contact: string }
  theme: { color: string }
  handler: (response: RazorpayResponse) => void
  modal: { ondismiss: () => void }
}

export interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
}

export function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('Not in browser')); return }
    if (window.Razorpay) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Razorpay script failed to load'))
    document.body.appendChild(script)
  })
}

export async function openRazorpay(
  payload: RazorpayOrderPayload,
  phoneNumber: string,
  onSuccess: (res: RazorpayResponse) => void,
  onDismiss: () => void,
): Promise<void> {
  await loadRazorpay()
  const rp = new window.Razorpay({
    key:         payload.key_id,
    amount:      payload.amount,
    currency:    payload.currency,
    order_id:    payload.razorpay_order_id,
    name:        'ETA Eats',
    description: 'Highway food pre-order',
    prefill:     { contact: phoneNumber },
    theme:       { color: '#FF6B2B' },
    handler:     onSuccess,
    modal:       { ondismiss: onDismiss },
  })
  rp.open()
}
