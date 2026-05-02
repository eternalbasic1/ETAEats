import { z } from 'zod';

export const ApiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>;

export class DomainError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(envelope: ApiErrorEnvelope['error']) {
    super(envelope.message);
    this.name = 'DomainError';
    this.code = envelope.code;
    this.details = envelope.details;
  }

  static fromResponse(body: unknown): DomainError {
    const parsed = ApiErrorEnvelopeSchema.parse(body);
    return new DomainError(parsed.error);
  }
}
