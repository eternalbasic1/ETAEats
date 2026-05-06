import { api } from '../client';

export interface ValidatePromoPayload {
  code: string;
  cart_total: string;
  restaurant_id?: number | null;
}

export interface ValidatePromoResponse {
  valid: boolean;
  discount_amount: string;
  final_total: string;
  message: string;
}

export const promoEndpoints = {
  validate: (payload: ValidatePromoPayload) =>
    api.post<ValidatePromoResponse>('/promos/validate/', payload),
};
