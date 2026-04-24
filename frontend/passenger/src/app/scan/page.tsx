'use client'
import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QrCode, Camera, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'

const TOKEN_LENGTH = 6

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
  const [chars, setChars] = useState<string[]>(Array(TOKEN_LENGTH).fill(''))
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const token = useMemo(() => chars.join(''), [chars])
  const fromMenu = searchParams.get('from') === 'menu'

  function fillFromRaw(raw: string) {
    const parsed = parseQRCodeInput(raw).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, TOKEN_LENGTH)
    if (!parsed) return
    const next = Array(TOKEN_LENGTH).fill('')
    parsed.split('').forEach((ch, idx) => { next[idx] = ch })
    setChars(next)
    const focusIndex = Math.min(parsed.length, TOKEN_LENGTH - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  function handleCharChange(idx: number, raw: string) {
    const value = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (value.length > 1) {
      fillFromRaw(value)
      return
    }

    const next = [...chars]
    next[idx] = value
    setChars(next)
    if (value && idx < TOKEN_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus()
    }
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !chars[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    fillFromRaw(e.clipboardData.getData('text'))
  }

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
          <label className="text-xs uppercase tracking-wide text-text-muted">
            Enter 6-character bus code
          </label>
          <div className="mt-3">
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: TOKEN_LENGTH }).map((_, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputsRef.current[idx] = el }}
                  value={chars[idx]}
                  onChange={(e) => handleCharChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  inputMode="text"
                  maxLength={1}
                  className="h-12 w-11 rounded-md bg-surface2 border border-border text-center text-lg font-bold uppercase text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-text-muted">
              <QrCode className="h-3.5 w-3.5" />
              <span>Code format: A1B2C3 (caps alphanumeric)</span>
            </div>
          </div>
          <Button className="w-full mt-4" disabled={token.length !== TOKEN_LENGTH}>
            Continue to Menu
          </Button>
        </form>
      </div>
    </div>
  )
}
