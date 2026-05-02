import { api } from '../client';

export const notificationEndpoints = {
  list: (params?: { page?: number; page_size?: number }) =>
    api.get('/notifications/', { params }),

  markRead: (id: number) =>
    api.patch(`/notifications/${id}/`, { is_read: true }),

  markAllRead: () =>
    api.post('/notifications/mark-all-read/'),
};
