/**
 * Authentication Helper Functions
 *
 * Shared utilities for Clerk authentication in Cloud Functions
 * This is the single source of truth for authentication logic
 */

const { HttpsError } = require('firebase-functions/v2/https');
const { createClerkClient, verifyToken: clerkVerifyToken } = require('@clerk/backend');
const { defineSecret } = require('firebase-functions/params');

// Load Clerk secret
const CLERK_SECRET_KEY = defineSecret('CLERK_SECRET_KEY');

// Lazy-load Clerk instance (singleton pattern)
let clerkInstance = null;

/**
 * Get or create Clerk client instance
 * @returns {ClerkClient} Clerk client instance
 */
function getClerk() {
  if (!clerkInstance) {
    clerkInstance = createClerkClient({ secretKey: CLERK_SECRET_KEY.value() });
  }
  return clerkInstance;
}

/**
 * Verify Clerk session token and return user data
 * This is the single source of truth for authentication in Cloud Functions
 *
 * @param {string} sessionToken - Clerk session token from client
 * @returns {Promise<{userId: string, email: string}>} User ID and email
 * @throws {HttpsError} If token is invalid or verification fails
 */
async function verifyClerkToken(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') {
    throw new HttpsError('unauthenticated', 'Missing or invalid session token');
  }

  try {
    const clerk = getClerk();

    // Verify the session token using standalone JWT verification (no network call)
    const payload = await clerkVerifyToken(sessionToken, {
      secretKey: CLERK_SECRET_KEY.value()
    });

    if (!payload || !payload.sub) {
      throw new HttpsError('unauthenticated', 'Invalid session');
    }

    const userId = payload.sub;

    // Get user details from Clerk
    const user = await clerk.users.getUser(userId);

    if (!user) {
      throw new HttpsError('unauthenticated', 'User not found');
    }

    // Get primary email
    const primaryEmail = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail) {
      throw new HttpsError('unauthenticated', 'User email not found');
    }

    return {
      userId: user.id,
      email: primaryEmail.emailAddress,
    };
  } catch (error) {
    console.error('Clerk token verification error:', error);

    // Re-throw HttpsErrors as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors in HttpsError
    throw new HttpsError('unauthenticated', 'Failed to verify authentication token');
  }
}

module.exports = {
  getClerk,
  verifyClerkToken,
  CLERK_SECRET_KEY
};
