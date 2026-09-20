import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

/**
 * Rejects a replayed App Check token. Every callable consumes its token
 * (`consumeAppCheckToken`, config.ts) and the web app sends limited-use tokens, so a token the
 * App Check service has already seen means a captured request is being sent again. The SDK only
 * flags this; the rejection has to be explicit.
 */
export function rejectConsumedAppCheckToken(request: CallableRequest<unknown>): void {
  if (request.app?.alreadyConsumed) {
    throw new HttpsError('permission-denied', 'App Check token already used.');
  }
}
