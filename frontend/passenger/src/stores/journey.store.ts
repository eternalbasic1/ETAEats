import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const JOURNEY_TTL_HOURS = 4
const HISTORY_LIMIT = 5

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

export interface JourneyContext {
  journeyId: string
  qrToken: string
  bus: BusInfo
  restaurant: RestaurantInfo
  source: 'camera' | 'manual'
  scannedAt: string
  expiresAt: string
  lastUsedAt: string
}

interface JourneyState {
  activeJourney: JourneyContext | null
  history: JourneyContext[]
  setJourneyFromScan: (input: {
    qrToken: string
    bus: BusInfo
    restaurant: RestaurantInfo
    source?: 'camera' | 'manual'
  }) => JourneyContext
  touchJourney: () => void
  clearJourney: () => void
  invalidateIfExpired: () => boolean
}

function nowISO() {
  return new Date().toISOString()
}

function expiryISO(hours: number) {
  const d = new Date()
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}

function makeJourneyId() {
  return `jrny_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      activeJourney: null,
      history: [],

      setJourneyFromScan: ({ qrToken, bus, restaurant, source = 'camera' }) => {
        const stamp = nowISO()
        const journey: JourneyContext = {
          journeyId: makeJourneyId(),
          qrToken,
          bus,
          restaurant,
          source,
          scannedAt: stamp,
          expiresAt: expiryISO(JOURNEY_TTL_HOURS),
          lastUsedAt: stamp,
        }
        const current = get().activeJourney
        set((state) => ({
          activeJourney: journey,
          history: current ? [current, ...state.history].slice(0, HISTORY_LIMIT) : state.history,
        }))
        return journey
      },

      touchJourney: () => {
        const current = get().activeJourney
        if (!current) return
        set({ activeJourney: { ...current, lastUsedAt: nowISO() } })
      },

      clearJourney: () => set({ activeJourney: null }),

      invalidateIfExpired: () => {
        const current = get().activeJourney
        if (!current) return false
        const isExpired = new Date(current.expiresAt).getTime() <= Date.now()
        if (isExpired) set({ activeJourney: null })
        return isExpired
      },
    }),
    {
      name: 'eta-journey',
      version: 1,
    },
  ),
)
