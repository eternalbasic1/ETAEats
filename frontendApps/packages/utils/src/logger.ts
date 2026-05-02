type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b[6-9]\d{9}\b/g, replacement: '****$&'.slice(-4) },
  { pattern: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, replacement: '<email redacted>' },
  { pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: '<JWT redacted>' },
  {
    pattern: /(token|password|otp|secret|key|signature)["']?\s*[:=]\s*["']?[^\s"',}]+/gi,
    replacement: '$1=<redacted>',
  },
];

function redact(input: string): string {
  let result = input;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function redactPayload(payload: unknown): unknown {
  if (typeof payload === 'string') return redact(payload);
  if (typeof payload !== 'object' || payload === null) return payload;
  try {
    return JSON.parse(redact(JSON.stringify(payload)));
  } catch {
    return '<unserializable>';
  }
}

type BreadcrumbCallback = (level: LogLevel, message: string, data?: unknown) => void;
let breadcrumbCallback: BreadcrumbCallback | null = null;

export function setBreadcrumbCallback(cb: BreadcrumbCallback): void {
  breadcrumbCallback = cb;
}

function write(level: LogLevel, message: string, data?: unknown): void {
  const safeMessage = redact(message);
  const safeData = data !== undefined ? redactPayload(data) : undefined;

  if (__DEV__) {
    const fn = level === 'debug' ? console.log : console[level];
    if (safeData !== undefined) {
      fn(`[${level.toUpperCase()}] ${safeMessage}`, safeData);
    } else {
      fn(`[${level.toUpperCase()}] ${safeMessage}`);
    }
  }

  breadcrumbCallback?.(level, safeMessage, safeData);
}

export const log = {
  debug: (msg: string, data?: unknown) => write('debug', msg, data),
  info: (msg: string, data?: unknown) => write('info', msg, data),
  warn: (msg: string, data?: unknown) => write('warn', msg, data),
  error: (msg: string, data?: unknown) => write('error', msg, data),
};
