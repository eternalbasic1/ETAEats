export type SocketState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface SocketOptions {
  url: () => string | null;
  onMessage: (data: unknown) => void;
  onStateChange?: (state: SocketState) => void;
  maxAttempts?: number;
  baseBackoffMs?: number;
}

interface SocketHandle {
  close: () => void;
  reconnect: () => void;
  getState: () => SocketState;
}

export function createSocket(opts: SocketOptions): SocketHandle {
  const maxAttempts = opts.maxAttempts ?? 5;
  const baseBackoffMs = opts.baseBackoffMs ?? 1000;

  let ws: WebSocket | null = null;
  let state: SocketState = 'idle';
  let attempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function setState(next: SocketState): void {
    state = next;
    opts.onStateChange?.(next);
  }

  function connect(): void {
    if (closed) return;

    const url = opts.url();
    if (!url) {
      setState('disconnected');
      return;
    }

    setState(attempt > 0 ? 'reconnecting' : 'connecting');
    ws = new WebSocket(url);

    ws.onopen = () => {
      attempt = 0;
      setState('connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: unknown = JSON.parse(event.data as string);
        opts.onMessage(data);
      } catch {
        // malformed JSON — ignore
      }
    };

    ws.onclose = (event: CloseEvent) => {
      ws = null;

      // Normal close or auth rejection — don't retry
      if (event.code === 1000 || event.code === 4401 || event.code === 4403) {
        setState('disconnected');
        return;
      }

      if (closed) {
        setState('disconnected');
        return;
      }

      if (attempt < maxAttempts) {
        const jitter = 1 + (Math.random() * 0.4 - 0.2); // ±20%
        const delay = baseBackoffMs * Math.pow(2, attempt) * jitter;
        attempt += 1;
        setState('reconnecting');
        retryTimer = setTimeout(connect, delay);
      } else {
        setState('disconnected');
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  function close(): void {
    closed = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    ws?.close(1000);
    ws = null;
    setState('disconnected');
  }

  function reconnect(): void {
    closed = false;
    attempt = 0;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    ws?.close(1000);
    ws = null;
    connect();
  }

  connect();

  return {
    close,
    reconnect,
    getState: () => state,
  };
}
