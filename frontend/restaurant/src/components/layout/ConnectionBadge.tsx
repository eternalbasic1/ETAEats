import { Badge } from '@/components/ui'
import type { ConnectionState } from '@/hooks/useRestaurantSocket'

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  if (state === 'connected') return <Badge variant="mint" size="sm" dot>Live</Badge>
  if (state === 'reconnecting') return <Badge variant="cream" size="sm" dot>Reconnecting…</Badge>
  return <Badge variant="neutral" size="sm">Offline</Badge>
}
