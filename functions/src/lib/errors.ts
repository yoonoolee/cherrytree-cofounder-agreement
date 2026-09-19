import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';

/** Message of anything a `catch` block can receive. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

/**
 * Logs `error` and returns what a callable should throw for it: an `HttpsError` passes through
 * (its code and message are meant for the client), anything else becomes an opaque `internal`
 * error so implementation details never leak.
 */
export function toHttpsError(
  error: unknown,
  logMessage: string,
  clientMessage: string,
): HttpsError {
  logger.error(logMessage, error);
  return error instanceof HttpsError ? error : new HttpsError('internal', clientMessage);
}
