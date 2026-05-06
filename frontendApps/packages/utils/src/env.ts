import { z } from 'zod';

const envSchema = z.object({
  apiBaseUrl: z.string().url(),
  wsBaseUrl: z.string().url(),
  sentryDsn: z.string().optional(),
  posthogKey: z.string().optional(),
  razorpayKeyId: z.string().min(1).optional(),
  appEnv: z.enum(['development', 'staging', 'production']),
  appName: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function initEnv(extra: Record<string, unknown>): Env {
  _env = envSchema.parse(extra);
  return _env;
}

export function getEnv(): Env {
  if (!_env) {
    throw new Error('initEnv() must be called before getEnv(). Call it in your app _layout.tsx.');
  }
  return _env;
}
