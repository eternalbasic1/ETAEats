import { useEffect, useState } from 'react';

/**
 * Returns whether the current time is "night" (7 PM – 6 AM),
 * matching the same logic used in JourneyCard.tsx.
 * Re-evaluates every 60 seconds so the theme switches at sunrise/sunset
 * without requiring an app restart.
 */
export function isNightTime(): boolean {
  const h = new Date().getHours();
  return h >= 19 || h < 6;
}

export function useTimeOfDay(): { isNight: boolean } {
  const [isNight, setIsNight] = useState(isNightTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsNight(isNightTime());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { isNight };
}
