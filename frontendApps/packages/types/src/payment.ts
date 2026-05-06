import { z } from 'zod';

export const RazorpayOrderPayloadSchema = z.object({
  razorpay_order_id: z.string(),
  amount: z.number(),
  currency: z.string(),
  key_id: z.string(),
});

export type RazorpayOrderPayload = z.infer<typeof RazorpayOrderPayloadSchema>;

export const RazorpayConfirmPayloadSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export type RazorpayConfirmPayload = z.infer<typeof RazorpayConfirmPayloadSchema>;
