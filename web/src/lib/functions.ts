/**
 * Typed entry point for the `onCall` Cloud Functions (contracts in `@cherrytree/shared`).
 *
 * Every call carries a limited-use App Check token: the server consumes it
 * (`consumeAppCheckToken`, functions/src/config.ts) and rejects a replay, so a captured request
 * cannot be sent twice. Apart from the Clerk → Firebase exchange and the public contact form,
 * callables identify the caller by the Firebase session, so those wait for Firebase Auth and
 * fail here when nobody is signed in instead of round-tripping to an `unauthenticated` error.
 */
import { httpsCallable, type HttpsCallableOptions } from 'firebase/functions';
import type { CallableName, CallableRequest, CallableResponse } from '@cherrytree/shared';

import { auth, functions } from './firebase.ts';

const CALL_OPTIONS: HttpsCallableOptions = { limitedUseAppCheckTokens: true };

/** Callables that do not need a Firebase session. */
const SESSIONLESS: ReadonlySet<CallableName> = new Set<CallableName>([
  'getFirebaseToken',
  'sendContactMessage',
]);

export const SESSION_NOT_READY_MESSAGE = 'Your session is still loading. Please try again.';

export async function callFunction<K extends CallableName>(
  name: K,
  data: CallableRequest<K>,
): Promise<CallableResponse<K>> {
  if (!SESSIONLESS.has(name)) {
    await auth.authStateReady();
    if (!auth.currentUser) {
      throw new Error(SESSION_NOT_READY_MESSAGE);
    }
  }

  const callable = httpsCallable<CallableRequest<K>, CallableResponse<K>>(
    functions,
    name,
    CALL_OPTIONS,
  );
  const result = await callable(data);
  return result.data;
}
