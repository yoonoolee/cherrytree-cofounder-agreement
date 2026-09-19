/**
 * Authentication helpers.
 *
 * Callables identify the caller through `request.auth`: the web app exchanges its Clerk session
 * for a Firebase custom token (`getFirebaseToken`) and signs in to Firebase, so every later
 * call carries a Firebase ID token whose `uid` is the Clerk user id. Only the exchange itself
 * still verifies a Clerk session token.
 */
import { createClerkClient, verifyToken, type ClerkClient } from '@clerk/backend';
import { logger } from 'firebase-functions';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

import { CLERK_SECRET_KEY } from '../config.ts';

let clerkInstance: ClerkClient | null = null;

/** Lazily created Clerk client; the secret is only readable at runtime. */
export function getClerk(): ClerkClient {
  clerkInstance ??= createClerkClient({ secretKey: CLERK_SECRET_KEY.value() });
  return clerkInstance;
}

/** Clerk user id of the signed-in caller, or `unauthenticated`. */
export function requireAuth(request: CallableRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  return uid;
}

/** Primary email address of a Clerk user, or `unauthenticated` when the user or address is missing. */
export async function getClerkPrimaryEmail(userId: string): Promise<string> {
  const user = await getClerk().users.getUser(userId);
  if (!user) {
    throw new HttpsError('unauthenticated', 'User not found');
  }

  const primaryEmail = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId);
  if (!primaryEmail) {
    throw new HttpsError('unauthenticated', 'User email not found');
  }

  return primaryEmail.emailAddress;
}

/**
 * Verifies a Clerk session token (offline JWT check, then a Clerk lookup so a deleted user is
 * rejected) and returns the user's id and primary email.
 */
export async function verifyClerkToken(
  sessionToken: unknown,
): Promise<{ userId: string; email: string }> {
  if (!sessionToken || typeof sessionToken !== 'string') {
    throw new HttpsError('unauthenticated', 'Missing or invalid session token');
  }

  try {
    const payload = await verifyToken(sessionToken, { secretKey: CLERK_SECRET_KEY.value() });
    if (!payload?.sub) {
      throw new HttpsError('unauthenticated', 'Invalid session');
    }

    return { userId: payload.sub, email: await getClerkPrimaryEmail(payload.sub) };
  } catch (error) {
    logger.error('Clerk token verification error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('unauthenticated', 'Failed to verify authentication token');
  }
}
