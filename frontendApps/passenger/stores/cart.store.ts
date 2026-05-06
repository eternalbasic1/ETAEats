import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorage } from './mmkv';

export interface CartItem {
  id: number;
  menu_item: number;
  menu_item_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

interface CartState {
  cartId: string | null;
  busId: number | null;
  restaurantId: number | null;
  items: CartItem[];
  setCart: (cartId: string, busId: number | null, restaurantId: number | null, items: CartItem[]) => void;
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
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
    {
      name: 'eta-cart',
      storage: createJSONStorage(() => asyncStorage),
    },
  ),
);
