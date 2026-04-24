import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrderStatus } from '@/lib/api.types'

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface ActiveOrderSummary {
  id: string
  restaurantName: string
  totalAmount: string
  createdAt: string
  status: OrderStatus
}

interface OrderTrackingState {
  activeOrder: ActiveOrderSummary | null
  connectionState: ConnectionState
  lastStatusEventAt: string | null
  setActiveOrder: (order: ActiveOrderSummary | null) => void
  setConnectionState: (state: ConnectionState) => void
  updateOrderStatus: (status: OrderStatus) => void
  clearIfComplete: () => void
}

const TERMINAL_STATUSES: OrderStatus[] = ['PICKED_UP', 'CANCELLED']

export const useOrderTrackingStore = create<OrderTrackingState>()(
  persist(
    (set, get) => ({
      activeOrder: null,
      connectionState: 'idle',
      lastStatusEventAt: null,

      setActiveOrder: (order) => set({ activeOrder: order }),

      setConnectionState: (connectionState) => set({ connectionState }),

      updateOrderStatus: (status) => {
        const current = get().activeOrder
        if (!current) return
        set({
          activeOrder: { ...current, status },
          lastStatusEventAt: new Date().toISOString(),
        })
      },

      clearIfComplete: () => {
        const current = get().activeOrder
        if (!current) return
        if (TERMINAL_STATUSES.includes(current.status)) {
          set({ activeOrder: null })
        }
      },
    }),
    {
      name: 'eta-order-tracking',
      version: 1,
      partialize: (s) => ({
        activeOrder: s.activeOrder,
        lastStatusEventAt: s.lastStatusEventAt,
      }),
    }
  )
)
