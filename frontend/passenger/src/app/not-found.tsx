import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">🤔</div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Page not found</h2>
      <p className="text-text-secondary text-sm mb-6">
        This page doesn&apos;t exist. Scan the QR code in your bus to get started.
      </p>
      <Link href="/scan/invalid" className="text-primary font-semibold text-sm">
        Go to start
      </Link>
    </div>
  )
}
