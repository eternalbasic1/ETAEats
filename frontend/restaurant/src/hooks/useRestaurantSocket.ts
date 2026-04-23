'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import type { OrderStatusPayload } from '@/lib/api.types'

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface UseRestaurantSocketOptions {
  onMessage: (payload: OrderStatusPayload) => void
  enabled?: boolean
}

export function useRestaurantSocket({ onMessage, enabled = true }: UseRestaurantSocketOptions) {
  const { accessToken, restaurantId } = useAuthStore()
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxRetries = 3
  const onMessageRef = useRef(onMessage)

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  const connect = useCallback(() => {
    if (!accessToken || !restaurantId) return
    const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000'
    const url = `${WS_BASE}/ws/restaurant/${restaurantId}/?token=${accessToken}`
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
        onMessageRef.current(payload)
      } catch {
        /* ignore malformed */
      }
    }

    ws.onclose = (event) => {
      if (event.code === 1000 || event.code === 4401 || event.code === 4403) {
        setConnectionState('disconnected')
        return
      }
      if (retryCount.current < maxRetries) {
        const delay = Math.pow(2, retryCount.current) * 1000
        retryCount.current += 1
        setConnectionState('reconnecting')
        retryTimer.current = setTimeout(connect, delay)
      } else {
        setConnectionState('disconnected')
      }
    }

    ws.onerror = () => { ws.close() }
  }, [accessToken, restaurantId])

  useEffect(() => {
    if (!enabled || !accessToken || !restaurantId) {
      setConnectionState('disconnected')
      return
    }
    connect()
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
      wsRef.current?.close(1000)
    }
  }, [enabled, accessToken, restaurantId, connect])

  return { connectionState }
}
