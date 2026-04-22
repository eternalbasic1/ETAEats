import { Utensils } from 'lucide-react'

export default function NoRestaurantPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/10 border border-warning/30 mx-auto mb-6">
        <Utensils className="h-10 w-10 text-warning" />
      </div>
      <h1 className="text-xl font-bold text-text-primary mb-3">
        No restaurant assigned yet
      </h1>
      <p className="text-text-secondary text-sm max-w-xs">
        This bus doesn&apos;t have a restaurant assigned right now. Check back once your bus is closer to the food stop.
      </p>
    </div>
  )
}
