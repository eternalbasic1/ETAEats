import { Utensils } from 'lucide-react'
import { EmptyState } from '@/components/ui'

export default function NoRestaurantPage() {
  return (
    <div className="min-h-[100dvh] bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <EmptyState
          icon={<Utensils className="h-6 w-6" strokeWidth={1.7} />}
          tone="peach"
          title="No restaurant assigned yet"
          description="This bus doesn't have a highway kitchen assigned right now. We'll reach out the moment one is ready."
        />
      </div>
    </div>
  )
}
