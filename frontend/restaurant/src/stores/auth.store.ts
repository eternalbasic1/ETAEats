import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/api.types'
import { setStoredTokens, clearStoredTokens } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  restaurantId: number | null
  restaurantName: string | null
  isAuthenticated: boolean
  setAuth: (user: User, access: string, refresh: string) => void
  updateUser: (user: User) => void
  clearAuth: () => void
}

function pickRestaurant(user: User): { id: number | null; name: string | null } {
  const m = user.memberships.find(
    (x) => x.is_active && x.org_type === 'restaurant',
  )
  return { id: m ? m.org_id : null, name: m ? m.org_name : null }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      restaurantId: null,
      restaurantName: null,
      isAuthenticated: false,

      setAuth: (user, access, refresh) => {
        setStoredTokens(access, refresh)
        const { id, name } = pickRestaurant(user)
        set({
          user,
          accessToken: access,
          refreshToken: refresh,
          restaurantId: id,
          restaurantName: name,
          isAuthenticated: true,
        })
      },

      updateUser: (user) => {
        const { id, name } = pickRestaurant(user)
        set((state) => ({
          user,
          // Keep existing token pair untouched.
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          restaurantId: id,
          restaurantName: name,
          isAuthenticated: state.isAuthenticated,
        }))
      },

      clearAuth: () => {
        clearStoredTokens()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          restaurantId: null,
          restaurantName: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'eta-restaurant-auth-state',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        restaurantId: s.restaurantId,
        restaurantName: s.restaurantName,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
)
