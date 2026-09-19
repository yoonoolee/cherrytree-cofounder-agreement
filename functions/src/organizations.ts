/**
 * Organization membership: inviting and removing collaborators through the Clerk backend API.
 * A project is a Clerk organization (`projects/{clerkOrgId}`); only its `org:admin` may change
 * members, and only while the project's edit window is open.
 */
import type { ClerkClient, OrganizationMembership } from '@clerk/backend';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import type { CallableRequest as CallableData, CallableResponse } from '@cherrytree/shared';

import { CALLABLE_OPTIONS, CLERK_SECRET_KEY } from './config.ts';
import { resolveAppOrigin } from './lib/appOrigin.ts';
import { getClerk, requireAuth } from './lib/auth.ts';
import { toHttpsError } from './lib/errors.ts';
import { projects } from './lib/firebase.ts';

/** Invitees always join as members; admin rights are never granted through this path. */
const INVITEE_ROLE = 'org:member';

/** Throws `permission-denied` once the project's edit window has passed. */
async function validateEditWindow(organizationId: string): Promise<void> {
  const project = (await projects.doc(organizationId).get()).data();
  if (!project?.editDeadline) return;

  const editDeadline = project.editDeadline.toDate();
  if (new Date() > editDeadline) {
    const formattedDeadline = editDeadline.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    throw new HttpsError(
      'permission-denied',
      `Cannot modify collaborators after edit window expired on ${formattedDeadline}`,
    );
  }
}

async function listMemberships(
  clerk: ClerkClient,
  organizationId: string,
): Promise<OrganizationMembership[]> {
  const { data } = await clerk.organizations.getOrganizationMembershipList({ organizationId });
  return data;
}

function findMembership(
  memberships: OrganizationMembership[],
  userId: string,
): OrganizationMembership | undefined {
  return memberships.find((membership) => membership.publicUserData?.userId === userId);
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value) {
    throw new HttpsError('invalid-argument', message);
  }
  return value;
}

// ---------------------------------------------------------------------------
// createOrganizationInvitation
// ---------------------------------------------------------------------------

/** Same basic shape check the client applies; Clerk validates the address for real. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createOrganizationInvitation = onCall(
  { ...CALLABLE_OPTIONS, secrets: [CLERK_SECRET_KEY] },
  async (
    request: CallableRequest<CallableData<'createOrganizationInvitation'>>,
  ): Promise<CallableResponse<'createOrganizationInvitation'>> => {
    const userId = requireAuth(request);
    const { emailAddress, organizationId } = request.data ?? {};

    if (!emailAddress || !organizationId) {
      throw new HttpsError('invalid-argument', 'Email address and organization ID are required');
    }
    if (typeof emailAddress !== 'string' || !EMAIL_SHAPE.test(emailAddress)) {
      throw new HttpsError('invalid-argument', 'Invalid email address format');
    }
    requireString(organizationId, 'Email address and organization ID are required');

    try {
      const clerk = getClerk();
      const requester = findMembership(await listMemberships(clerk, organizationId), userId);

      if (!requester) {
        throw new HttpsError(
          'permission-denied',
          'You must be a member of this organization to invite others',
        );
      }
      if (requester.role !== 'org:admin') {
        throw new HttpsError('permission-denied', 'Only organization admins can invite members');
      }

      await validateEditWindow(organizationId);

      // The link in the invitation email lands on our accept-invite page.
      const redirectUrl = `${resolveAppOrigin(request.rawRequest.headers.origin)}/accept-invite`;
      const invitation = await clerk.organizations.createOrganizationInvitation({
        organizationId,
        emailAddress,
        role: INVITEE_ROLE,
        redirectUrl,
      });

      return { success: true, invitationId: invitation.id, redirectUrl };
    } catch (error) {
      throw toHttpsError(
        error,
        'Error creating organization invitation:',
        'Failed to create organization invitation',
      );
    }
  },
);

// ---------------------------------------------------------------------------
// removeOrganizationMember
// ---------------------------------------------------------------------------

export const removeOrganizationMember = onCall(
  { ...CALLABLE_OPTIONS, secrets: [CLERK_SECRET_KEY] },
  async (
    request: CallableRequest<CallableData<'removeOrganizationMember'>>,
  ): Promise<CallableResponse<'removeOrganizationMember'>> => {
    const requestingUserId = requireAuth(request);
    const userId = requireString(request.data?.userId, 'User ID is required');
    const organizationId = requireString(
      request.data?.organizationId,
      'Organization ID is required',
    );

    try {
      const clerk = getClerk();
      const memberships = await listMemberships(clerk, organizationId);

      const requester = findMembership(memberships, requestingUserId);
      if (!requester || requester.role !== 'org:admin') {
        throw new HttpsError('permission-denied', 'Only organization admins can remove members');
      }

      await validateEditWindow(organizationId);

      if (requestingUserId === userId) {
        throw new HttpsError(
          'invalid-argument',
          'You cannot remove yourself from the organization',
        );
      }

      if (!findMembership(memberships, userId)) {
        throw new HttpsError('not-found', 'User is not a member of this organization');
      }

      await clerk.organizations.deleteOrganizationMembership({ organizationId, userId });

      return { success: true };
    } catch (error) {
      throw toHttpsError(
        error,
        'Error removing organization member:',
        'Failed to remove organization member',
      );
    }
  },
);
