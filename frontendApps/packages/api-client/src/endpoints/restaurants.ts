import { api } from '../client';

export const restaurantEndpoints = {
  scan: (qrToken: string) =>
    api.get(`/restaurants/scan/${qrToken}/`),

  list: (params?: { page?: number; page_size?: number }) =>
    api.get('/restaurants/', { params }),

  get: (id: number) =>
    api.get(`/restaurants/${id}/`),

  create: (payload: Record<string, unknown>) =>
    api.post('/restaurants/', payload),

  update: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/restaurants/${id}/`, payload),

  menuCategories: (restaurantId?: number) =>
    api.get('/restaurants/menu-categories/', { params: restaurantId ? { restaurant: restaurantId } : undefined }),

  createMenuCategory: (payload: { name: string; restaurant: number; sort_order?: number }) =>
    api.post('/restaurants/menu-categories/', payload),

  deleteMenuCategory: (id: number) =>
    api.delete(`/restaurants/menu-categories/${id}/`),

  menuItems: (params?: { restaurant?: number; category?: number }) =>
    api.get('/restaurants/menu-items/', { params }),

  createMenuItem: (payload: Record<string, unknown>) =>
    api.post('/restaurants/menu-items/', payload),

  updateMenuItem: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/restaurants/menu-items/${id}/`, payload),

  deleteMenuItem: (id: number) =>
    api.delete(`/restaurants/menu-items/${id}/`),
};
