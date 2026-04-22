'use client'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import type { OrderStatus, OrderStatusPayload } from '@/lib/api.types'

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface UseOrderSocketOptions {
  orderId: string
  onStatusChange: (status: OrderStatus) => void
}

export function useOrderSocket({ orderId, onStatusChange }: UseOrderSocketOptions) {
  const { accessToken } = useAuthStore()
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxRetries = 3

  useEffect(() => {
    if (!accessToken) {
      setConnectionState('disconnected')
      return
    }

    function connect() {
      const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000'
      const url = `${WS_BASE}/ws/user/?token=${accessToken}`
      const ws = new WebSocket(url)
      wsRef.current = ws
      setConnectionState(retryCount.current > 0 ? 'reconnecting' : 'connecting')

      ws.onopen = () => {
        setConnectionState('connected')
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
          setConnectionState('disconnected')
          return
        }
        if (retryCount.current < maxRetries) {
          const delay = Math.pow(2, retryCount.current) * 1000 // 1s, 2s, 4s
          retryCount.current += 1
          setConnectionState('reconnecting')
          retryTimer.current = setTimeout(connect, delay)
        } else {
          setConnectionState('disconnected')
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
