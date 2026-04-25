import { QrCode } from 'lucide-react'
import { EmptyState } from '@/components/ui'

export default function ScanInvalidPage() {
  return (
    <div className="min-h-[100dvh] bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <EmptyState
          icon={<QrCode className="h-6 w-6" strokeWidth={1.7} />}
          tone="powder"
          title="Scan your bus QR"
          description="Look for the ETAEats sticker inside your bus — usually near the seats or on the back of the seat in front of you."
        />
      </div>
    </div>
  )
}
