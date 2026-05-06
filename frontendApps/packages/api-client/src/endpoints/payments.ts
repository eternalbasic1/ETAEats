import { api } from '../client';

export interface RazorpayOrderResponse {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export interface RazorpayConfirmPayload {
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentEndpoints = {
  createRazorpayOrder: (orderId: string) =>
    api.get<RazorpayOrderResponse>('/payments/razorpay/order/', { params: { order_id: orderId } }),

  confirmPayment: (payload: RazorpayConfirmPayload) =>
    api.post('/payments/razorpay/confirm/', payload),
};
