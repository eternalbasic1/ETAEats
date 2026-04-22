import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/lib/api.types'

interface CartState {
  cartId: string | null
  busId: number | null
  restaurantId: number | null
  items: CartItem[]
  setCart: (cartId: string, busId: number | null, restaurantId: number | null, items: CartItem[]) => void
  setItems: (items: CartItem[]) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      busId: null,
      restaurantId: null,
      items: [],

      setCart: (cartId, busId, restaurantId, items) =>
        set({ cartId, busId, restaurantId, items }),

      setItems: (items) => set({ items }),

      clearCart: () =>
        set({ cartId: null, busId: null, restaurantId: null, items: [] }),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + parseFloat(i.line_total), 0),
    }),
    { name: 'eta-cart' }
  )
)
