import React, { useState } from 'react';
import { useOrganization } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// Constants
const SUCCESS_MESSAGE_DURATION_MS = 10000; // How long to display success message (10 seconds)

function CollaboratorManager({ project }) {
  const { organization, memberships, invitations, membership } = useOrganization({
    memberships: {
      infinite: true,
      keepPreviousData: true
    },
    invitations: {
      infinite: true,
      keepPreviousData: true
    }
    // Note: Non-admins will get 403 on invitations, but it's handled gracefully
  });
  const { getToken } = useAuth();

  // Check if current user is admin
  const isAdmin = membership?.role === 'org:admin';

  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If project doesn't have a Clerk organization, show message
  if (!project.clerkOrgId) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-600 mb-2">
          This is a legacy project. Please create a new project to use the member management features.
        </p>
      </div>
    );
  }

  // If the organization context doesn't match this project, show message
  if (organization?.id !== project.clerkOrgId) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-600 mb-2">
          Please switch to this project's organization to manage members.
        </p>
      </div>
    );
  }

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviting(true);

    try {
      // Get Clerk session token
      const sessionToken = await getToken({ template: 'firebase' });

      // Call backend function to create organization invitation with custom redirect
      const createInvitation = httpsCallable(functions, 'createOrganizationInvitation');
      await createInvitation({
        sessionToken,
        emailAddress: email,
        organizationId: organization.id,
        role: 'org:member'
      });

      setSuccess('An invitation has been sent if the email exists. Please ask them to check their spam folder if they don\'t see it in their inbox.');
      setEmail('');
      // Refresh both lists
      await memberships?.revalidate?.();
      await invitations?.revalidate?.();
      // Clear success message after configured duration
      setTimeout(() => setSuccess(''), SUCCESS_MESSAGE_DURATION_MS);
    } catch (err) {
      console.error('Invite error:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      // Get Clerk session token
      const sessionToken = await getToken({ template: 'firebase' });

      // Call Firebase Function to remove member via backend API
      const removeOrganizationMember = httpsCallable(functions, 'removeOrganizationMember');
      await removeOrganizationMember({
        sessionToken,
        userId,
        organizationId: organization.id
      });
    } catch (err) {
      console.error('Error removing member:', err);
    } finally {
      // Always refresh the list to show current state
      await memberships?.revalidate?.();
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    try {
      const invitation = invitations?.data?.find(inv => inv.id === invitationId);
      if (invitation) {
        await invitation.revoke();
        // Refresh the invitations list
        await invitations?.revalidate?.();
      }
    } catch (err) {
      console.error('Error revoking invitation:', err);
    }
  };

  return (
    <div className="w-full">
      <p className="text-sm text-gray-700 font-medium mb-2">
        Every cofounder needs to be added as a collaborator.
      </p>
      <p className="text-sm text-gray-600 mb-6">
        Only Admins can add or remove collaborators.
      </p>

      {/* Invite Form - Only visible to admins */}
      {isAdmin && (
        <form onSubmit={handleInvite} className="mb-8">
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {inviting ? 'Sending...' : 'Invite'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
        </form>
      )}

      {/* Members List */}
      {(memberships?.data?.length > 0 || (isAdmin && invitations?.data?.length > 0)) && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Members</h4>
          <div className="space-y-2">
            {/* Active Members */}
            {memberships?.data?.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {membership.publicUserData.identifier}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="capitalize">{membership.role.replace('org:', '').replace('_', ' ').replace('basic ', '')}</span>
                    <span className="mx-1">·</span>
                    <span className="text-green-700 font-medium">Active</span>
                  </p>
                </div>
                {isAdmin && membership.role !== 'org:admin' && (
                  <button
                    onClick={() => handleRemoveMember(membership.publicUserData.userId)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            {/* Pending Invitations - Only shown to admins */}
            {isAdmin && invitations?.data?.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{invitation.emailAddress}</p>
                  <p className="text-xs text-gray-500">
                    <span className="capitalize">{invitation.role.replace('org:', '').replace('_', ' ').replace('basic ', '')}</span>
                    <span className="mx-1">·</span>
                    <span className="text-yellow-700 font-medium">Pending</span>
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeInvitation(invitation.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CollaboratorManager;