import { z } from 'zod';

export const RestaurantSchema = z.object({
  id: z.number(),
  name: z.string(),
  owner_name: z.string(),
  phone_number: z.string(),
  email: z.string(),
  address: z.string(),
  fssai_license_number: z.string(),
  hygiene_rating: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;

export const MenuCategorySchema = z.object({
  id: z.number(),
  restaurant: z.number().optional(),
  name: z.string(),
  sort_order: z.number(),
});

export type MenuCategory = z.infer<typeof MenuCategorySchema>;

export const MenuItemSchema = z.object({
  id: z.number(),
  restaurant: z.number(),
  category: z.number().nullable(),
  category_name: z.string().nullable(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  photo_url: z.string(),
  is_available: z.boolean(),
  prep_time_minutes: z.number(),
  created_at: z.string(),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;
