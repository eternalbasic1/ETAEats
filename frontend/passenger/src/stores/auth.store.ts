import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/api.types'
import { setStoredTokens, clearStoredTokens } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
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
      name: 'eta-auth',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)
