type QueueEntry = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let queue: QueueEntry[] = [];

function drainQueue(error: unknown, token: string | null): void {
  for (const entry of queue) {
    if (error) entry.reject(error);
    else if (token) entry.resolve(token);
  }
  queue = [];
}

export type RefreshFn = (refreshToken: string) => Promise<{ access: string; refresh?: string }>;
export type TokenGetter = () => Promise<{ access: string; refresh: string } | null>;
export type TokenSetter = (access: string, refresh: string) => Promise<void>;
export type TokenClearer = () => Promise<void>;
export type LogoutCallback = () => void;

interface RefreshDeps {
  getTokens: TokenGetter;
  setTokens: TokenSetter;
  clearTokens: TokenClearer;
  refreshCall: RefreshFn;
  onLogout: LogoutCallback;
}

let deps: RefreshDeps | null = null;

export function configureRefresh(d: RefreshDeps): void {
  deps = d;
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = await deps?.getTokens();
  return tokens?.access ?? null;
}

export async function handleUnauthorized(): Promise<string> {
  if (!deps) throw new Error('configureRefresh() not called');

  const tokens = await deps.getTokens();
  if (!tokens?.refresh) {
    await deps.clearTokens();
    deps.onLogout();
    throw new Error('No refresh token');
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      queue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const result = await deps.refreshCall(tokens.refresh);
    const newRefresh = result.refresh ?? tokens.refresh;
    await deps.setTokens(result.access, newRefresh);
    drainQueue(null, result.access);
    return result.access;
  } catch (err) {
    drainQueue(err, null);
    await deps.clearTokens();
    deps.onLogout();
    throw err;
  } finally {
    isRefreshing = false;
  }
}
