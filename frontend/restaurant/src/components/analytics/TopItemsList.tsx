import { Card } from '@/components/ui'

interface TopItem {
  name: string
  count: number
  revenue: number
}

export function TopItemsList({ items }: { items: TopItem[] }) {
  return (
    <Card tone="default" padding="lg" radius="card" shadow="e1">
      <p className="text-label text-text-muted">Bestsellers</p>
      <h3 className="mt-1.5 text-h3 text-text-primary">Top 5 items today</h3>

      {items.length === 0 ? (
        <p className="mt-6 text-body-sm text-text-muted text-center py-6">No sales yet today.</p>
      ) : (
        <ol className="mt-6 space-y-3">
          {items.map((item, i) => (
            <li key={item.name} className="flex items-center gap-4 py-2 border-b border-border-subtle last:border-0">
              <span className="h-9 w-9 rounded-lg bg-accent-soft-cream text-accent-ink-soft-cream font-semibold flex items-center justify-center text-body-sm tabular-nums flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-text-primary truncate">{item.name}</p>
                <p className="text-caption text-text-muted mt-0.5 tabular-nums">
                  Sold {item.count} · ₹{item.revenue.toFixed(0)}
                </p>
              </div>
              <span className="text-h4 text-text-primary tabular-nums">₹{item.revenue.toFixed(0)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
