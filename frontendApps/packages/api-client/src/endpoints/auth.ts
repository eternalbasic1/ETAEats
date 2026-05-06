import { api } from '../client';

export interface OtpRequestPayload {
  phone_number: string;
}

export type AppType = 'passenger' | 'restaurant' | 'admin';

export interface OtpVerifyPayload {
  phone_number: string;
  code: string;
  app_type: AppType;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: {
    id: number | string;
    phone_number: string;
    role: string;
    full_name: string;
    email: string | null;
    gender?: string;
    memberships?: Array<{
      id: number;
      org_type: string;
      org_id: number;
      org_name: string;
      org_role: string;
      is_active: boolean;
    }>;
  };
  tokens: AuthTokens;
}

export interface MeResponse {
  id: number | string;
  phone_number: string;
  role: string;
  full_name: string;
  email: string | null;
  gender?: string;
  memberships?: Array<{
    id: number;
    org_type: string;
    org_id: number;
    org_name: string;
    org_role: string;
    is_active: boolean;
  }>;
}

export interface SignupPayload {
  phone_number: string;
  email: string;
  full_name: string;
}

export const authEndpoints = {
  signup: (payload: SignupPayload) =>
    api.post<{ status: string }>('/auth/signup/', payload),

  requestOtp: (payload: OtpRequestPayload) =>
    api.post<{ status: string }>('/auth/otp/request/', payload),

  verifyOtp: (payload: OtpVerifyPayload) =>
    api.post<AuthResponse>('/auth/otp/verify/', payload),

  refreshToken: (refresh: string) =>
    api.post<{ access: string }>('/auth/token/refresh/', { refresh }),

  me: () =>
    api.get<MeResponse>('/auth/me/'),

  updateMe: (payload: Partial<Pick<MeResponse, 'full_name' | 'email' | 'gender'>> & { fcm_token?: string | null }) =>
    api.patch<MeResponse>('/auth/me/', payload),

  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),
};
