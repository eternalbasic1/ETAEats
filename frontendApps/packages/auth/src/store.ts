import { create } from 'zustand';
import { tokenStore } from './secureStorage';

export type UserRole = 'PASSENGER' | 'RESTAURANT_STAFF' | 'BUS_OPERATOR' | 'ADMIN';

export interface AuthUser {
  id: number | string;
  phone_number: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  gender?: string;
  restaurantId?: number;
  memberships?: Array<{
    id: number;
    org_type: string;
    org_id: number;
    org_name: string;
    org_role: string;
    is_active: boolean;
  }>;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setAuth: (user: AuthUser, access: string, refresh: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  hasHydrated: false,

  setAuth: async (user, access, refresh) => {
    await tokenStore.set(access, refresh);
    const restaurantMembership = user.memberships?.find(
      (m) => m.org_type === 'restaurant' && m.is_active,
    );
    set({
      user: { ...user, restaurantId: restaurantMembership?.org_id },
      isAuthenticated: true,
    });
  },

  clearAuth: async () => {
    await tokenStore.clear();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const tokens = await tokenStore.get();
    if (!tokens) {
      set({ hasHydrated: true });
      return;
    }
    // Tokens exist; mark as authenticated. The app will fetch /me to populate user.
    set({ isAuthenticated: true, hasHydrated: true });
  },

  setUser: (user) => {
    const restaurantMembership = user.memberships?.find(
      (m) => m.org_type === 'restaurant' && m.is_active,
    );
    set({ user: { ...user, restaurantId: restaurantMembership?.org_id } });
  },
}));
