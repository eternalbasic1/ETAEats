'use client'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useOrderTrackingStore } from '@/stores/orderTracking.store'
import type { OrderStatus, OrderStatusPayload } from '@/lib/api.types'

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface UseOrderSocketOptions {
  orderId: string
  onStatusChange: (status: OrderStatus) => void
}

export function useOrderSocket({ orderId, onStatusChange }: UseOrderSocketOptions) {
  const { accessToken } = useAuthStore()
  const { setConnectionState: setGlobalConnectionState } = useOrderTrackingStore()
  const [connectionState, setLocalConnectionState] = useState<ConnectionState>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxRetries = 3

  useEffect(() => {
    if (!accessToken) {
      setLocalConnectionState('disconnected')
      setGlobalConnectionState('disconnected')
      return
    }

    function connect() {
      const WS_BASE =
        process.env.NEXT_PUBLIC_WS_URL ??
        (typeof window !== 'undefined'
          ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8000`
          : 'ws://localhost:8000')
      const url = `${WS_BASE}/ws/user/?token=${accessToken}`
      const ws = new WebSocket(url)
      wsRef.current = ws
      setLocalConnectionState(retryCount.current > 0 ? 'reconnecting' : 'connecting')
      setGlobalConnectionState(retryCount.current > 0 ? 'reconnecting' : 'connecting')

      ws.onopen = () => {
        setLocalConnectionState('connected')
        setGlobalConnectionState('connected')
        retryCount.current = 0
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data as string) as OrderStatusPayload
          if (payload.order_id === orderId && payload.status) {
            onStatusChange(payload.status)
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = (event) => {
        if (event.code === 1000 || event.code === 4401) {
          setLocalConnectionState('disconnected')
          setGlobalConnectionState('disconnected')
          return
        }
        if (retryCount.current < maxRetries) {
          const delay = Math.pow(2, retryCount.current) * 1000 // 1s, 2s, 4s
          retryCount.current += 1
          setLocalConnectionState('reconnecting')
          setGlobalConnectionState('reconnecting')
          retryTimer.current = setTimeout(connect, delay)
        } else {
          setLocalConnectionState('disconnected')
          setGlobalConnectionState('disconnected')
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
      wsRef.current?.close(1000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, orderId])

  return { connectionState }
}
