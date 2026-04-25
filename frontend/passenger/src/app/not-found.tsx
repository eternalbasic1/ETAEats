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
          description="Looks like you've wandered off route. Let's get you back on the highway."
          action={
            <Link href="/auth/login">
              <Button variant="primary">Go to login</Button>
            </Link>
          }
        />
      </div>
    </div>
  )
}
