import { api } from '../client';

export const fleetEndpoints = {
  operators: (params?: { page?: number; page_size?: number }) =>
    api.get('/fleet/operators/', { params }),

  createOperator: (payload: Record<string, unknown>) =>
    api.post('/fleet/operators/', payload),

  updateOperator: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/fleet/operators/${id}/`, payload),

  routes: (params?: { page?: number; page_size?: number }) =>
    api.get('/fleet/routes/', { params }),

  createRoute: (payload: Record<string, unknown>) =>
    api.post('/fleet/routes/', payload),

  updateRoute: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/fleet/routes/${id}/`, payload),

  buses: (params?: { page?: number; page_size?: number }) =>
    api.get('/fleet/buses/', { params }),

  createBus: (payload: Record<string, unknown>) =>
    api.post('/fleet/buses/', payload),

  updateBus: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/fleet/buses/${id}/`, payload),

  assignRestaurant: (busId: number, payload: { restaurant: number }) =>
    api.post(`/fleet/buses/${busId}/assign_restaurant/`, payload),

  assignments: (params?: { bus?: number; restaurant?: number; is_active?: boolean }) =>
    api.get('/fleet/assignments/', { params }),
};
