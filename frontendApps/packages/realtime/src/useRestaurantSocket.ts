import { useEffect, useRef, useState, useCallback } from 'react';
import { createSocket } from './socket';
import type { SocketState } from './socket';

interface UseRestaurantSocketOptions {
  accessToken: string | null;
  restaurantId: number | null | undefined;
  wsBaseUrl: string;
  onMessage: (payload: unknown) => void;
  enabled?: boolean;
}

export function useRestaurantSocket({
  accessToken,
  restaurantId,
  wsBaseUrl,
  onMessage,
  enabled = true,
}: UseRestaurantSocketOptions) {
  const [connectionState, setConnectionState] = useState<SocketState>('idle');
  const onMessageRef = useRef(onMessage);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const reconnect = useCallback(() => {
    socketRef.current?.reconnect();
  }, []);

  useEffect(() => {
    if (!enabled || !accessToken || !restaurantId) {
      setConnectionState('disconnected');
      return;
    }

    const socket = createSocket({
      url: () => `${wsBaseUrl}/ws/restaurant/${restaurantId}/?token=${accessToken}`,
      onMessage: (data) => onMessageRef.current(data),
      onStateChange: setConnectionState,
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, accessToken, restaurantId, wsBaseUrl]);

  return { connectionState, reconnect };
}
