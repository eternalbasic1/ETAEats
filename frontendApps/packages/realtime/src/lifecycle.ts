import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

interface UseAppStateGateOptions {
  onForeground: () => void;
  onBackground: () => void;
  gracePeriodMs?: number;
}

export function useAppStateGate({
  onForeground,
  onBackground,
  gracePeriodMs = 15_000,
}: UseAppStateGateOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        onForeground();
      } else if (nextState === 'background') {
        timerRef.current = setTimeout(() => {
          onBackground();
          timerRef.current = null;
        }, gracePeriodMs);
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => {
      sub.remove();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onForeground, onBackground, gracePeriodMs]);
}
