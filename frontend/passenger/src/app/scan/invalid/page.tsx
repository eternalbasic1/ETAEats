import { QrCode } from 'lucide-react'

export default function ScanInvalidPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface2 border border-border mx-auto mb-6">
        <QrCode className="h-10 w-10 text-text-secondary" />
      </div>
      <h1 className="text-xl font-bold text-text-primary mb-3">
        Scan your bus QR code
      </h1>
      <p className="text-text-secondary text-sm max-w-xs">
        Look for the ETA Eats QR code sticker inside your bus — usually near the seats or on the back of the seat in front of you.
      </p>
    </div>
  )
}
