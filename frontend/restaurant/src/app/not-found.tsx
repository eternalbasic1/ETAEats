import Link from 'next/link'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🤷</div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Page not found</h2>
      <p className="text-text-secondary text-sm mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  )
}
