import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

interface UseIdleLockOptions {
  timeoutMs: number;
  onLock: () => void;
  enabled?: boolean;
}

export function useIdleLock({ timeoutMs, onLock, enabled = true }: UseIdleLockOptions): void {
  const backgroundAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundAtRef.current = Date.now();
      } else if (nextState === 'active' && backgroundAtRef.current) {
        const elapsed = Date.now() - backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (elapsed >= timeoutMs) {
          onLock();
        }
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, [timeoutMs, onLock, enabled]);
}

interface UseTokenRefreshOnForegroundOptions {
  getTokenExpiry: () => number | null;
  refreshToken: () => Promise<void>;
  bufferMs?: number;
}

export function useTokenRefreshOnForeground({
  getTokenExpiry,
  refreshToken,
  bufferMs = 60_000,
}: UseTokenRefreshOnForegroundOptions): void {
  useEffect(() => {
    const handleChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;

      const expiry = getTokenExpiry();
      if (expiry === null) return;

      const remainingMs = expiry * 1000 - Date.now();
      if (remainingMs < bufferMs) {
        refreshToken().catch(() => {});
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, [getTokenExpiry, refreshToken, bufferMs]);
}
