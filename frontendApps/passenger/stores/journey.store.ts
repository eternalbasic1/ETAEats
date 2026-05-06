import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorage } from './mmkv';

const JOURNEY_TTL_FALLBACK_HOURS = 8;

interface BusInfo {
  id: number;
  name: string;
  numberPlate: string;
}

interface RestaurantInfo {
  id: number;
  name: string;
  address: string;
  hygieneRating: string | null;
}

export interface JourneyContext {
  journeyId: string;
  qrToken: string;
  bus: BusInfo;
  restaurant: RestaurantInfo;
  source: 'camera' | 'manual';
  scannedAt: string;
  expiresAt: string;
  lastUsedAt: string;
}

interface JourneyState {
  activeJourney: JourneyContext | null;
  setJourneyFromScan: (input: {
    qrToken: string;
    bus: BusInfo;
    restaurant: RestaurantInfo;
    expiresAt?: string;
    source?: 'camera' | 'manual';
  }) => JourneyContext;
  touchJourney: () => void;
  clearJourney: () => void;
  invalidateIfExpired: () => boolean;
}

function nowISO() {
  return new Date().toISOString();
}

function expiryISO(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function makeJourneyId() {
  return `jrny_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      activeJourney: null,

      setJourneyFromScan: ({ qrToken, bus, restaurant, expiresAt, source = 'manual' }) => {
        const stamp = nowISO();
        const journey: JourneyContext = {
          journeyId: makeJourneyId(),
          qrToken,
          bus,
          restaurant,
          source,
          scannedAt: stamp,
          expiresAt: expiresAt ?? expiryISO(JOURNEY_TTL_FALLBACK_HOURS),
          lastUsedAt: stamp,
        };
        set({ activeJourney: journey });
        return journey;
      },

      touchJourney: () => {
        const current = get().activeJourney;
        if (!current) return;
        set({ activeJourney: { ...current, lastUsedAt: nowISO() } });
      },

      clearJourney: () => set({ activeJourney: null }),

      invalidateIfExpired: () => {
        const current = get().activeJourney;
        if (!current) return false;
        const isExpired = new Date(current.expiresAt).getTime() <= Date.now();
        if (isExpired) set({ activeJourney: null });
        return isExpired;
      },
    }),
    {
      name: 'eta-journey',
      version: 1,
      storage: createJSONStorage(() => asyncStorage),
    },
  ),
);
