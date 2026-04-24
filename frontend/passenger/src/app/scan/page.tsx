'use client'
import { FormEvent, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QrCode, Camera, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'

function parseQRCodeInput(raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  try {
    const url = new URL(value)
    const parts = url.pathname.split('/').filter(Boolean)
    const token = parts[parts.length - 1]
    return token ?? value
  } catch {
    return value
  }
}

export default function ScanHubPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [input, setInput] = useState('')
  const token = useMemo(() => parseQRCodeInput(input), [input])
  const fromMenu = searchParams.get('from') === 'menu'

  function openCameraFlow() {
    toast('Camera scanner integration pending. Use QR token entry for now.')
    router.push('/scan/invalid')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    router.push(`/scan/${encodeURIComponent(token)}`)
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto pt-6">
        <button
          onClick={() => router.push('/home')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <h1 className="text-xl font-bold text-text-primary">Scan Bus QR</h1>
        <p className="text-sm text-text-secondary mt-1">
          Scan using camera or paste the QR token/URL manually.
        </p>
        {fromMenu && (
          <div className="mt-3 rounded-lg border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning">
            Scan your bus QR first to access the menu.
          </div>
        )}

        <button
          onClick={openCameraFlow}
          className="mt-5 w-full rounded-xl border border-border bg-surface px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-text-primary"
        >
          <Camera className="h-4 w-4" />
          Open Camera Scanner
        </button>

        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-border bg-surface p-4">
          <label htmlFor="qr-input" className="text-xs uppercase tracking-wide text-text-muted">
            Enter QR token or scan URL
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface2 px-3 py-2">
            <QrCode className="h-4 w-4 text-text-muted" />
            <input
              id="qr-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 8d9f4a... or https://.../scan/8d9f4a"
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <Button className="w-full mt-3" disabled={!token}>
            Continue to Menu
          </Button>
        </form>
      </div>
    </div>
  )
}
