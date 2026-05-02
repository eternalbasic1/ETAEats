import { useState, useCallback } from 'react';
import { useAuthStore } from './store';
import type { AuthUser } from './store';

interface UseAuthOptions {
  requestOtpFn: (phone: string) => Promise<void>;
  verifyOtpFn: (phone: string, code: string) => Promise<{
    user: AuthUser;
    tokens: { access: string; refresh: string };
  }>;
  logoutFn: (refreshToken: string) => Promise<void>;
  getRefreshToken: () => Promise<string | null>;
  onLoginSuccess?: () => void;
  onLogout?: () => void;
}

export function useAuth(options: UseAuthOptions) {
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const requestOTP = useCallback(
    async (phoneNumber: string): Promise<boolean> => {
      setLoading(true);
      try {
        await options.requestOtpFn(phoneNumber);
        return true;
      } catch {
        return false;
      } finally {
        setLoading(false);
      }
    },
    [options.requestOtpFn],
  );

  const verifyOTP = useCallback(
    async (phoneNumber: string, code: string): Promise<{ success: boolean; user?: AuthUser }> => {
      setLoading(true);
      try {
        const result = await options.verifyOtpFn(phoneNumber, code);
        await setAuth(result.user, result.tokens.access, result.tokens.refresh);
        options.onLoginSuccess?.();
        return { success: true, user: result.user };
      } catch {
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [options.verifyOtpFn, setAuth, options.onLoginSuccess],
  );

  const logout = useCallback(async () => {
    try {
      const refresh = await options.getRefreshToken();
      if (refresh) {
        await options.logoutFn(refresh).catch(() => {});
      }
    } finally {
      await clearAuth();
      options.onLogout?.();
    }
  }, [options.logoutFn, options.getRefreshToken, clearAuth, options.onLogout]);

  return { requestOTP, verifyOTP, logout, loading, isAuthenticated, user };
}
