/**
 * Organization Management Functions
 *
 * Handles organization invitations and member management
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getClerk, verifyClerkToken, CLERK_SECRET_KEY } = require('./auth-helpers');
const { getFirestore } = require('firebase-admin/firestore');

// Shared Cloud Functions configuration
// Optimized for free tier: 256MB memory
const FUNCTION_CONFIG = {
  region: 'us-west2',
  memory: '256MiB',
  serviceAccount: `cloud-functions@${process.env.GCLOUD_PROJECT}.iam.gserviceaccount.com`,
};

// Note: Authentication helpers (verifyClerkToken, getClerk, CLERK_SECRET_KEY)
// are imported from auth-helpers.js

// ============================================================================
// EDIT WINDOW VALIDATION
// ============================================================================

/**
 * Validate that project's edit window has not expired
 * @param {string} organizationId - The Clerk organization ID
 * @returns {Promise<void>} - Throws HttpsError if edit window expired
 */
async function validateEditWindow(organizationId) {
  const db = getFirestore();

  const projectsSnapshot = await db.collection('projects')
    .where('clerkOrgId', '==', organizationId)
    .limit(1)
    .get();

  if (projectsSnapshot.empty) {
    return;
  }

  const project = projectsSnapshot.docs[0].data();

  if (!project.editDeadline) {
    return;
  }

  const editDeadline = project.editDeadline.toDate();

  if (new Date() > editDeadline) {
    const formattedDeadline = editDeadline.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    throw new HttpsError(
      'permission-denied',
      `Cannot modify collaborators after edit window expired on ${formattedDeadline}`
    );
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
  secrets: [CLERK_SECRET_KEY],
  invoker: 'public',
  consumeAppCheckToken: true
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

    // Validate edit window (6 months after first submission)
    await validateEditWindow(organizationId);

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
  consumeAppCheckToken: true
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

    // Validate edit window (6 months after first submission)
    await validateEditWindow(organizationId);

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
