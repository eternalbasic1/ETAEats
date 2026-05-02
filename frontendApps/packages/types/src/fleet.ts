import { z } from 'zod';

export const BusOperatorSchema = z.object({
  id: z.number(),
  company_name: z.string(),
  contact_name: z.string(),
  phone_number: z.string(),
  email: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export type BusOperator = z.infer<typeof BusOperatorSchema>;

export const RouteSchema = z.object({
  id: z.number(),
  origin_city: z.string(),
  destination_city: z.string(),
  distance_km: z.number(),
  estimated_duration_hours: z.string(),
});

export type Route = z.infer<typeof RouteSchema>;

export const BusSchema = z.object({
  id: z.number(),
  operator: z.number(),
  operator_name: z.string(),
  route: z.number().nullable(),
  route_label: z.string().nullable(),
  bus_name: z.string(),
  number_plate: z.string(),
  qr_token: z.string(),
  qr_image_url: z.string(),
  total_seats: z.number(),
  is_active: z.boolean(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  last_gps_update: z.string().nullable(),
  created_at: z.string(),
});

export type Bus = z.infer<typeof BusSchema>;

export const BusRestaurantAssignmentSchema = z.object({
  id: z.number(),
  bus: z.number(),
  bus_name: z.string(),
  restaurant: z.number(),
  restaurant_name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export type BusRestaurantAssignment = z.infer<typeof BusRestaurantAssignmentSchema>;
