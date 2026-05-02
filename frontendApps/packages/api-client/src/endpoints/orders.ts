import { api } from '../client';

export const orderEndpoints = {
  getCart: () =>
    api.get('/orders/cart/'),

  addToCart: (payload: { menu_item: number; quantity: number; bus_id?: number }) =>
    api.post('/orders/cart/', payload),

  updateCartItem: (itemId: number, payload: { quantity: number }) =>
    api.patch(`/orders/cart/items/${itemId}/`, payload),

  removeCartItem: (itemId: number) =>
    api.delete(`/orders/cart/items/${itemId}/`),

  checkout: (payload: { cart_id: number; bus_id: number }) =>
    api.post('/orders/checkout/', payload),

  myOrders: (params?: { page?: number; page_size?: number; status?: string }) =>
    api.get('/orders/my/', { params }),

  myOrder: (id: string) =>
    api.get(`/orders/my/${id}/`),

  restaurantOrders: (params?: { status?: string; page?: number; page_size?: number }) =>
    api.get('/orders/restaurant/', { params }),

  advanceOrder: (orderId: string, payload: { status: string; reason?: string }) =>
    api.post(`/orders/restaurant/${orderId}/advance/`, payload),
};
