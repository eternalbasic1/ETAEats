import { z } from 'zod';
import { OrderStatusSchema } from './order';

export const OrderStatusPayloadSchema = z.object({
  order_id: z.string(),
  event: z.string(),
  status: OrderStatusSchema.optional(),
  title: z.string().optional(),
  body: z.string().optional(),
});

export type OrderStatusPayload = z.infer<typeof OrderStatusPayloadSchema>;
