import { useState, type FormEvent } from 'react';
import { useOrganization } from '@clerk/react';
import { toErrorMessage } from '@cherrytree/shared';

import { callFunction } from '../lib/functions.ts';
import { isAfterEditDeadline } from '../utils/dateUtils.ts';
import type { ProjectWithId } from '../hooks/useProjectSync.ts';

const SUCCESS_MESSAGE_DURATION_MS = 10000;

interface CollaboratorManagerProps {
  project: Pick<ProjectWithId, 'id' | 'editDeadline'>;
}

/** Invite, list and remove the Clerk organization members behind a project (admin only). */
function CollaboratorManager({ project }: CollaboratorManagerProps) {
  const { organization, memberships, invitations, membership } = useOrganization({
    memberships: { infinite: true, keepPreviousData: true },
    invitations: { infinite: true, keepPreviousData: true },
  });

  const isAdmin = membership?.role === 'org:admin';
  const isEditWindowExpired = isAfterEditDeadline(project.editDeadline);

  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null);

  if (!organization || organization.id !== project.id) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'Outfit, sans-serif' }}>
        <p style={{ fontSize: '13px', fontWeight: 300, color: '#555' }}>
          Please switch to this project's organization to manage members.
        </p>
      </div>
    );
  }

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviting(true);
    try {
      await callFunction('createOrganizationInvitation', {
        emailAddress: email,
        organizationId: organization.id,
      });
      setSuccess(
        "An invitation has been sent if the email exists. Ask them to check their spam folder if they don't see it.",
      );
      setEmail('');
      await memberships?.revalidate?.();
      await invitations?.revalidate?.();
      setTimeout(() => setSuccess(''), SUCCESS_MESSAGE_DURATION_MS);
    } catch (err) {
      console.error('Invite error:', err);
      setError(toErrorMessage(err) || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setRemovingUserId(userId);
    try {
      await callFunction('removeOrganizationMember', { userId, organizationId: organization.id });
    } catch (err) {
      console.error('Error removing member:', err);
    } finally {
      await memberships?.revalidate?.();
      setRemovingUserId(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setRevokingInvitationId(invitationId);
    try {
      const invitation = invitations?.data?.find((inv) => inv.id === invitationId);
      if (invitation) {
        await invitation.revoke();
        await invitations?.revalidate?.();
      }
    } catch (err) {
      console.error('Error revoking invitation:', err);
    } finally {
      setRevokingInvitationId(null);
    }
  };

  const formatRole = (role: string) =>
    role.replace('org:', '').replace('_', ' ').replace('basic ', '');

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', width: '100%' }}>
      <p style={{ fontSize: '13px', fontWeight: 400, color: '#1a1a1a', marginBottom: '4px' }}>
        Every cofounder needs to be added as a collaborator.
      </p>
      <p style={{ fontSize: '13px', fontWeight: 300, color: '#888', marginBottom: '24px' }}>
        Only Admins can add or remove collaborators.
      </p>

      {/* Invite form — admin only */}
      {isAdmin && (
        <form onSubmit={handleInvite} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#999',
                  letterSpacing: '0.04em',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cofounder@company.com"
                required
                style={{ width: '100%' }}
              />
            </div>
            <button
              type="submit"
              disabled={inviting || isEditWindowExpired}
              style={{
                padding: '9px 20px',
                background: inviting || isEditWindowExpired ? '#aaa' : '#4B7263',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 400,
                fontFamily: 'Outfit, sans-serif',
                cursor: inviting || isEditWindowExpired ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                marginBottom: '2px',
              }}
            >
              {inviting ? 'Sending...' : 'Invite'}
            </button>
          </div>
          {error && (
            <p style={{ fontSize: '12px', color: '#b97070', marginTop: '8px', fontWeight: 300 }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ fontSize: '12px', color: '#4B7263', marginTop: '8px', fontWeight: 300 }}>
              {success}
            </p>
          )}
        </form>
      )}

      {/* Members list */}
      {((memberships?.data?.length ?? 0) > 0 ||
        (isAdmin && (invitations?.data?.length ?? 0) > 0)) && (
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#999',
              letterSpacing: '0.04em',
              marginBottom: '10px',
            }}
          >
            Members
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {memberships?.data?.map((m) => {
              // Clerk types publicUserData (and its userId) as optional; memberships always carry it.
              const userId = m.publicUserData?.userId;
              const removing = userId !== undefined && removingUserId === userId;
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#E9E5DF',
                    borderRadius: '5px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 400, color: '#1a1a1a' }}>
                      {m.publicUserData?.identifier}
                    </div>
                    <div
                      style={{ fontSize: '11px', fontWeight: 300, color: '#888', marginTop: '2px' }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{formatRole(m.role)}</span>
                      <span style={{ margin: '0 5px' }}>·</span>
                      <span style={{ color: '#4B7263' }}>Active</span>
                    </div>
                  </div>
                  {isAdmin && m.role !== 'org:admin' && userId !== undefined && (
                    <button
                      onClick={() => handleRemoveMember(userId)}
                      disabled={removing || isEditWindowExpired}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: '#b97070',
                        cursor: removing || isEditWindowExpired ? 'not-allowed' : 'pointer',
                        opacity: removing || isEditWindowExpired ? 0.5 : 1,
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {removing ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              );
            })}

            {isAdmin &&
              invitations?.data?.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#E9E5DF',
                    borderRadius: '5px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 400, color: '#1a1a1a' }}>
                      {inv.emailAddress}
                    </div>
                    <div
                      style={{ fontSize: '11px', fontWeight: 300, color: '#888', marginTop: '2px' }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{formatRole(inv.role)}</span>
                      <span style={{ margin: '0 5px' }}>·</span>
                      <span style={{ color: '#a08c3a' }}>Pending</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeInvitation(inv.id)}
                    disabled={revokingInvitationId === inv.id || isEditWindowExpired}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 300,
                      color: '#b97070',
                      cursor:
                        revokingInvitationId === inv.id || isEditWindowExpired
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: revokingInvitationId === inv.id || isEditWindowExpired ? 0.5 : 1,
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    {revokingInvitationId === inv.id ? 'Removing...' : 'Remove'}
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
