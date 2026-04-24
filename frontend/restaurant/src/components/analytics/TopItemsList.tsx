import { Card } from '@/components/ui'

interface TopItem {
  name: string
  count: number
  revenue: number
}

export function TopItemsList({ items }: { items: TopItem[] }) {
  return (
    <Card>
      <h3 className="text-sm font-bold text-text-primary mb-3">Top 5 items today</h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">No sales yet today.</p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li key={item.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-text-muted w-4">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                <p className="text-xs text-text-muted">Sold {item.count} · ₹{item.revenue.toFixed(0)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
