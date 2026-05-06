import type { AxiosError } from 'axios';

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

function isApiErrorEnvelope(data: unknown): data is ApiErrorEnvelope {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorEnvelope).error === 'object' &&
    typeof (data as ApiErrorEnvelope).error.code === 'string'
  );
}

export function parseDomainError(error: AxiosError): DomainError {
  const data = error.response?.data;
  const status = error.response?.status;

  if (isApiErrorEnvelope(data)) {
    return new DomainError(
      data.error.code,
      data.error.message,
      data.error.details,
      status,
    );
  }

  if (error.code === 'ERR_NETWORK') {
    return new DomainError('network_error', 'No internet connection');
  }

  if (error.code === 'ECONNABORTED') {
    return new DomainError('timeout', 'Request timed out');
  }

  return new DomainError(
    'unknown',
    error.message || 'An unexpected error occurred',
    undefined,
    status,
  );
}
