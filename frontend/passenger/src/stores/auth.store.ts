import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/api.types'
import { setStoredTokens, clearStoredTokens } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  hasHydrated: boolean
  setHasHydrated: (value: boolean) => void
  setAuth: (user: User, access: string, refresh: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setAuth: (user, access, refresh) => {
        setStoredTokens(access, refresh)
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true })
      },

      clearAuth: () => {
        clearStoredTokens()
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      // Use a distinct key from 'eta-auth' which the Axios interceptor uses
      // for flat {access, refresh} storage. The Zustand wrapper format is
      // incompatible with getStoredTokens() and would break auth after reload.
      name: 'eta-auth-state',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
