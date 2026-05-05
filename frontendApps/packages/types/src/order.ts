import { z } from 'zod';

export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  PICKED_UP: 'PICKED_UP',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'CANCELLED',
]);

export const ALLOWED_STATUS_TRANSITIONS: Record<string, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['PICKED_UP'],
} as const;

export const PAYMENT_STATUSES = {
  UNPAID: 'UNPAID',
  AUTHORIZED: 'AUTHORIZED',
  CAPTURED: 'CAPTURED',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const PaymentStatusSchema = z.enum([
  'UNPAID',
  'AUTHORIZED',
  'CAPTURED',
  'REFUNDED',
  'FAILED',
]);

export const OrderItemSchema = z.object({
  id: z.number(),
  menu_item: z.number(),
  menu_item_name: z.string(),
  quantity: z.number(),
  unit_price: z.string(),
  line_total: z.string(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const ValidatePromoResponseSchema = z.object({
  valid: z.boolean(),
  discount_amount: z.string(),
  final_total: z.string(),
  message: z.string(),
});

export type ValidatePromoResponse = z.infer<typeof ValidatePromoResponseSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  passenger: z.string(),
  bus: z.number(),
  bus_name: z.string(),
  restaurant: z.number(),
  restaurant_name: z.string(),
  status: OrderStatusSchema,
  payment_status: PaymentStatusSchema,
  total_amount: z.string(),
  promo_code: z.string().optional().default(''),
  discount_amount: z.string().optional().default('0.00'),
  items: z.array(OrderItemSchema),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  confirmed_at: z.string().nullable(),
  ready_at: z.string().nullable(),
  picked_up_at: z.string().nullable(),
  cancelled_reason: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;

export const CartItemSchema = z.object({
  id: z.number(),
  menu_item: z.number(),
  menu_item_name: z.string(),
  quantity: z.number(),
  unit_price: z.string(),
  line_total: z.string(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  id: z.string(),
  bus: z.number().nullable(),
  restaurant: z.number().nullable(),
  items: z.array(CartItemSchema),
  total: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Cart = z.infer<typeof CartSchema>;
