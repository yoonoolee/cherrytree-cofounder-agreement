/**
 * Clerk → Firebase session bridge. The web app calls this right after Clerk sign-in with its
 * Clerk session token and signs in to Firebase with the returned custom token, whose uid is the
 * Clerk user id. It is the one callable that cannot rely on `request.auth` (there is no Firebase
 * session yet); App Check is still enforced.
 */
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { CallableRequest as CallableData, CallableResponse } from '@cherrytree/shared';

import { CALLABLE_OPTIONS, CLERK_SECRET_KEY } from './config.ts';
import { verifyClerkToken } from './lib/auth.ts';
import { toHttpsError } from './lib/errors.ts';
import { auth } from './lib/firebase.ts';

export const getFirebaseToken = onCall(
  { ...CALLABLE_OPTIONS, secrets: [CLERK_SECRET_KEY] },
  async (
    request: CallableRequest<CallableData<'getFirebaseToken'>>,
  ): Promise<CallableResponse<'getFirebaseToken'>> => {
    try {
      const { sessionToken } = request.data ?? {};
      if (!sessionToken) {
        throw new HttpsError('invalid-argument', 'Session token is required');
      }

      const { userId } = await verifyClerkToken(sessionToken);
      const firebaseToken = await auth.createCustomToken(userId);

      return { firebaseToken, userId };
    } catch (error) {
      throw toHttpsError(
        error,
        'Error creating Firebase token:',
        'Failed to create Firebase token',
      );
    }
  },
);
