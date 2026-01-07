/**
 * Organization Management Functions
 *
 * Handles organization invitations and member management
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { createClerkClient, verifyToken: clerkVerifyToken } = require('@clerk/backend');

// Load secrets
const CLERK_SECRET_KEY = defineSecret('CLERK_SECRET_KEY');

// Shared Cloud Functions configuration
const FUNCTION_CONFIG = {
  region: 'us-west2',
  serviceAccount: `cloud-functions@${process.env.GCLOUD_PROJECT}.iam.gserviceaccount.com`,
};

// Lazy-load Clerk instance
let clerkInstance = null;
const getClerk = () => {
  if (!clerkInstance) {
    clerkInstance = createClerkClient({ secretKey: CLERK_SECRET_KEY.value() });
  }
  return clerkInstance;
};

/**
 * Verify Clerk session token and return user data
 */
async function verifyClerkToken(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') {
    throw new HttpsError('unauthenticated', 'Missing or invalid session token');
  }

  try {
    const clerk = getClerk();

    // Verify the session token
    const payload = await clerkVerifyToken(sessionToken, {
      secretKey: CLERK_SECRET_KEY.value()
    });

    if (!payload || !payload.sub) {
      throw new HttpsError('unauthenticated', 'Invalid session');
    }

    const userId = payload.sub;

    // Get user details
    const user = await clerk.users.getUser(userId);

    if (!user) {
      throw new HttpsError('unauthenticated', 'User not found');
    }

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
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('unauthenticated', 'Authentication failed');
  }
}

// ============================================================================
// CREATE ORGANIZATION INVITATION
// ============================================================================

/**
 * Create organization invitation with custom redirect URL
 * This allows proper handling of invitation acceptance flow via /accept-invite page
 */
exports.createOrganizationInvitation = onCall({
  ...FUNCTION_CONFIG,
  secrets: [CLERK_SECRET_KEY]
}, async (request) => {
  const { sessionToken, emailAddress, organizationId, role } = request.data;

  // Verify Clerk authentication
  const { userId } = await verifyClerkToken(sessionToken);

  if (!emailAddress || !organizationId) {
    throw new HttpsError('invalid-argument', 'Email address and organization ID are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailAddress)) {
    throw new HttpsError('invalid-argument', 'Invalid email address format');
  }

  try {
    const clerk = getClerk();

    // Get all members of the organization and find the requesting user
    const { data: memberships } = await clerk.organizations.getOrganizationMembershipList({
      organizationId
    });

    const requestingMembership = memberships.find(m => m.publicUserData.userId === userId);

    if (!requestingMembership) {
      throw new HttpsError('permission-denied', 'You must be a member of this organization to invite others');
    }

    // Verify requesting user is an admin (only admins can invite)
    if (requestingMembership.role !== 'org:admin') {
      throw new HttpsError('permission-denied', 'Only organization admins can invite members');
    }

    // Get the current domain for redirect URL
    const origin = request.rawRequest.headers.origin || 'http://localhost:3000';
    const redirectUrl = `${origin}/accept-invite`;

    // Create organization invitation with redirect URL
    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: organizationId,
      emailAddress: emailAddress,
      role: role || 'org:member',
      redirectUrl: redirectUrl,
    });

    console.log(`Organization invitation created for ${emailAddress} to org ${organizationId} with redirect to ${redirectUrl}`);

    return {
      success: true,
      invitationId: invitation.id,
      redirectUrl: redirectUrl,
    };
  } catch (error) {
    console.error('Error creating organization invitation:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', error.message || 'Failed to create organization invitation');
  }
});

// ============================================================================
// REMOVE ORGANIZATION MEMBER
// ============================================================================

/**
 * Remove a member from an organization using Clerk backend API
 */
exports.removeOrganizationMember = onCall({
  ...FUNCTION_CONFIG,
  secrets: [CLERK_SECRET_KEY],
  invoker: 'public',
}, async (request) => {
  try {
    const { sessionToken, userId, organizationId } = request.data;

    if (!sessionToken) {
      throw new HttpsError('invalid-argument', 'Session token is required');
    }

    if (!userId) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    if (!organizationId) {
      throw new HttpsError('invalid-argument', 'Organization ID is required');
    }

    // Verify Clerk session token and get requesting user's ID
    const { userId: requestingUserId } = await verifyClerkToken(sessionToken);

    // Get Clerk client
    const clerk = getClerk();

    // Get all members of the organization
    const { data: memberships } = await clerk.organizations.getOrganizationMembershipList({
      organizationId
    });

    // Find the requesting user's membership
    const requestingMembership = memberships.find(m => m.publicUserData.userId === requestingUserId);

    if (!requestingMembership || requestingMembership.role !== 'org:admin') {
      throw new HttpsError('permission-denied', 'Only organization admins can remove members');
    }

    // Prevent admin from removing themselves
    if (requestingUserId === userId) {
      throw new HttpsError('invalid-argument', 'You cannot remove yourself from the organization');
    }

    // Find the membership to remove
    const membershipToRemove = memberships.find(m => m.publicUserData.userId === userId);

    if (!membershipToRemove) {
      throw new HttpsError('not-found', 'User is not a member of this organization');
    }

    // Delete the membership
    await clerk.organizations.deleteOrganizationMembership({
      organizationId,
      userId
    });

    console.log(`Removed user ${userId} from organization ${organizationId} by admin ${requestingUserId}`);

    return { success: true };
  } catch (error) {
    console.error('Error removing organization member:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to remove organization member');
  }
});
