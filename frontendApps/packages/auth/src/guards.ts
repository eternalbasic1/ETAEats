import { useEffect } from 'react';
import { useAuthStore } from './store';
import type { UserRole } from './store';

interface UseRequireRoleResult {
  isAuthorized: boolean;
  isLoading: boolean;
  rejectionReason: string | null;
}

export function useRequireRole(
  requiredRole: UserRole,
  onReject?: (reason: string) => void,
): UseRequireRoleResult {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  const isLoading = !hasHydrated;

  let rejectionReason: string | null = null;
  let isAuthorized = false;

  if (hasHydrated && isAuthenticated && user) {
    if (user.role !== requiredRole) {
      rejectionReason = `not_${requiredRole.toLowerCase()}`;
    } else if (
      requiredRole === 'RESTAURANT_STAFF' &&
      !user.memberships?.some((m) => m.org_type === 'restaurant' && m.is_active)
    ) {
      rejectionReason = 'no_restaurant';
    } else {
      isAuthorized = true;
    }
  } else if (hasHydrated && !isAuthenticated) {
    rejectionReason = 'not_authenticated';
  }

  useEffect(() => {
    if (rejectionReason && onReject) {
      onReject(rejectionReason);
    }
  }, [rejectionReason, onReject]);

  return { isAuthorized, isLoading, rejectionReason };
}

export function useRequireAuth(onReject?: () => void): {
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated && onReject) {
      onReject();
    }
  }, [hasHydrated, isAuthenticated, onReject]);

  return { isAuthenticated, isLoading: !hasHydrated };
}
