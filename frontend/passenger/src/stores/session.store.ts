import { create } from 'zustand'

interface BusInfo {
  id: number
  name: string
  numberPlate: string
}

interface RestaurantInfo {
  id: number
  name: string
  address: string
  hygieneRating: string | null
}

interface SessionState {
  qrToken: string | null
  bus: BusInfo | null
  restaurant: RestaurantInfo | null
  setSession: (qrToken: string, bus: BusInfo, restaurant: RestaurantInfo) => void
  clearSession: () => void
}

// NOT persisted — a new QR scan always starts fresh.
export const useSessionStore = create<SessionState>()((set) => ({
  qrToken: null,
  bus: null,
  restaurant: null,

  setSession: (qrToken, bus, restaurant) =>
    set({ qrToken, bus, restaurant }),

  clearSession: () =>
    set({ qrToken: null, bus: null, restaurant: null }),
}))
