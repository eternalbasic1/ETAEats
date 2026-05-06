import { useEffect, useRef, useState, useCallback } from 'react';
import { createSocket } from './socket';
import type { SocketState } from './socket';

interface UseUserSocketOptions {
  accessToken: string | null;
  wsBaseUrl: string;
  onMessage: (payload: unknown) => void;
  enabled?: boolean;
}

export function useUserSocket({
  accessToken,
  wsBaseUrl,
  onMessage,
  enabled = true,
}: UseUserSocketOptions) {
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
    if (!enabled || !accessToken) {
      setConnectionState('disconnected');
      return;
    }

    const socket = createSocket({
      url: () => `${wsBaseUrl}/ws/user/?token=${accessToken}`,
      onMessage: (data) => onMessageRef.current(data),
      onStateChange: setConnectionState,
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, accessToken, wsBaseUrl]);

  return { connectionState, reconnect };
}
