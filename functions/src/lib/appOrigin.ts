import { HttpsError } from 'firebase-functions/v2/https';

import { APP_ORIGIN, LOCAL_DEV_ORIGIN } from '../config.ts';

/**
 * Origin to send a user back to (Stripe checkout, invitation links). The request's `Origin`
 * header is honoured only when it is this project's app or the local dev server; anything
 * else — including a missing header — resolves to the configured app origin, so a caller can
 * never point a redirect somewhere we do not control.
 */
export function resolveAppOrigin(originHeader: string | string[] | undefined): string {
  const appOrigin = APP_ORIGIN.value();
  if (!appOrigin) {
    throw new HttpsError('internal', 'APP_ORIGIN is not configured');
  }

  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  return origin === appOrigin || origin === LOCAL_DEV_ORIGIN ? origin : appOrigin;
}
