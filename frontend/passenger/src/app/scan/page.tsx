'use client'
import { FormEvent, KeyboardEvent, Suspense, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Camera, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, Spinner } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'

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

function ScanHubInner() {
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
    <div className="app-shell-inner px-4 lg:px-0">
      <TopBar title="Scan bus QR" onBack={() => router.push('/home')} />

      <div className="pt-2">
        <p className="text-label text-text-muted">Step 1</p>
        <h1 className="mt-2 text-h2 lg:text-h1 text-text-primary">Find your bus&rsquo;s QR</h1>
        <p className="mt-2 text-body-sm text-text-tertiary max-w-md">
          Scan the sticker inside your bus — usually on the seat back or ceiling — or enter the 6-character code printed below it.
        </p>

        {fromMenu && (
          <div className="mt-5 flex items-start gap-3 rounded-lg bg-warning-bg border border-warning-border px-4 py-3">
            <div className="h-1.5 w-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
            <p className="text-body-sm text-warning">Scan your bus QR first to open the menu.</p>
          </div>
        )}

        <Card tone="default" padding="md" radius="card" shadow="e1" className="mt-6">
          <button onClick={openCameraFlow} className="w-full flex items-center gap-3 text-left">
            <span className="h-11 w-11 rounded-lg bg-accent-powder-blue text-accent-ink-powder-blue flex items-center justify-center">
              <Camera className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="flex-1">
              <span className="block text-h4 text-text-primary">Open camera scanner</span>
              <span className="block text-body-sm text-text-tertiary">Point your phone at the QR sticker</span>
            </span>
          </button>
        </Card>

        <Card tone="default" padding="md" radius="card" shadow="e1" className="mt-4">
          <form onSubmit={handleSubmit}>
            <p className="text-label text-text-muted">Or enter 6-digit code</p>
            <div className="mt-4 flex items-center justify-between gap-2">
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
                  className="h-13 w-11 sm:w-12 rounded-lg bg-surface2 border border-border text-center text-[20px] font-semibold uppercase text-text-primary
                             transition-all duration-base ease-standard
                             focus:border-border-strong focus:bg-surface focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-border-strong"
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-caption text-text-muted">
              <QrCode className="h-3.5 w-3.5" />
              <span>Format: A1B2C3 — uppercase letters & numbers</span>
            </div>
            <Button fullWidth size="lg" className="mt-5" disabled={token.length !== TOKEN_LENGTH}>
              Continue to menu
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function ScanHubPage() {
  return (
    <div className="app-shell slux-fade-in">
      <Suspense
        fallback={
          <div className="app-shell-inner flex items-center justify-center pt-20">
            <Spinner className="h-7 w-7" />
          </div>
        }
      >
        <ScanHubInner />
      </Suspense>
    </div>
  )
}
