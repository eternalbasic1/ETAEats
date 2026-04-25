import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <EmptyState
          icon={<Compass className="h-6 w-6" strokeWidth={1.7} />}
          tone="powder"
          title="Page not found"
          description="The page you're looking for doesn't exist."
          action={
            <Link href="/dashboard">
              <Button variant="primary">Go to dashboard</Button>
            </Link>
          }
        />
      </div>
    </div>
  )
}
