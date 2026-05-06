import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorage } from './mmkv';

/** Local line; checkout uses `lines` payload (no server cart item ids). */
export interface CartItem {
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
  setCart: (cartId: string | null, busId: number | null, restaurantId: number | null, items: CartItem[]) => void;
  setItems: (items: CartItem[]) => void;
  setLocalCart: (busId: number, restaurantId: number, items: CartItem[]) => void;
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

      setLocalCart: (busId, restaurantId, items) =>
        set({ cartId: null, busId, restaurantId, items }),

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
