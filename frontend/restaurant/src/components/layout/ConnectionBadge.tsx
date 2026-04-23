import { Badge } from '@/components/ui'
import type { ConnectionState } from '@/hooks/useRestaurantSocket'

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  if (state === 'connected') return <Badge variant="success" dot>LIVE</Badge>
  if (state === 'reconnecting') return <Badge variant="warning" dot>Reconnecting…</Badge>
  return <Badge variant="muted">Offline</Badge>
}
