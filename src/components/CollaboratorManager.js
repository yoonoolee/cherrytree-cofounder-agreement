import React, { useState } from 'react';
import { useOrganization } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { isAfterEditDeadline } from '../utils/dateUtils';

const SUCCESS_MESSAGE_DURATION_MS = 10000;

function CollaboratorManager({ project }) {
  const { organization, memberships, invitations, membership } = useOrganization({
    memberships: { infinite: true, keepPreviousData: true },
    invitations: { infinite: true, keepPreviousData: true },
  });
  const { getToken } = useAuth();

  const isAdmin = membership?.role === 'org:admin';
  const isEditWindowExpired = isAfterEditDeadline(project?.editDeadline);

  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removingUserId, setRemovingUserId] = useState(null);
  const [revokingInvitationId, setRevokingInvitationId] = useState(null);

  if (!project.id) {
    const subject = encodeURIComponent('[URGENT] Production Support Request - No Project ID');
    const body = encodeURIComponent(
      `Hi Cherrytree Support,\n\nI'm encountering an error with my project.\n\n--- Debug Info ---\nProject ID: ${project?.id || 'Unknown'}\nProject Name: ${project?.name || 'Unknown'}\nAdmin User ID: ${project?.admin || 'Unknown'}\nCreated At: ${project?.createdAt?.toDate?.()?.toISOString() || 'Unknown'}\nCurrent User ID: ${membership?.publicUserData?.userId || 'Unknown'}\nCurrent User Email: ${membership?.publicUserData?.identifier || 'Unknown'}\nError: Missing project ID\nTimestamp: ${new Date().toISOString()}\n------------------\n\nPlease help me resolve this issue.\n\nThank you.`
    );
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'Outfit, sans-serif' }}>
        <p style={{ fontSize: '13px', fontWeight: 300, color: '#555', marginBottom: '16px' }}>
          Something went wrong. Please contact support.
        </p>
        <a
          href={`mailto:hello@cherrytree.app?subject=${subject}&body=${body}`}
          style={{ display: 'inline-block', padding: '9px 20px', background: '#4B7263', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 400, textDecoration: 'none' }}
        >
          Contact Support
        </a>
      </div>
    );
  }

  if (organization?.id !== project.id) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'Outfit, sans-serif' }}>
        <p style={{ fontSize: '13px', fontWeight: 300, color: '#555' }}>
          Please switch to this project's organization to manage members.
        </p>
      </div>
    );
  }

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setInviting(true);
    try {
      const sessionToken = await getToken({ template: 'firebase' });
      const createInvitation = httpsCallable(functions, 'createOrganizationInvitation');
      await createInvitation({ sessionToken, emailAddress: email, organizationId: organization.id, role: 'org:member' });
      setSuccess("An invitation has been sent if the email exists. Ask them to check their spam folder if they don't see it.");
      setEmail('');
      await memberships?.revalidate?.();
      await invitations?.revalidate?.();
      setTimeout(() => setSuccess(''), SUCCESS_MESSAGE_DURATION_MS);
    } catch (err) {
      console.error('Invite error:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingUserId(userId);
    try {
      const sessionToken = await getToken({ template: 'firebase' });
      const removeOrganizationMember = httpsCallable(functions, 'removeOrganizationMember');
      await removeOrganizationMember({ sessionToken, userId, organizationId: organization.id });
    } catch (err) {
      console.error('Error removing member:', err);
    } finally {
      await memberships?.revalidate?.();
      setRemovingUserId(null);
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    setRevokingInvitationId(invitationId);
    try {
      const invitation = invitations?.data?.find(inv => inv.id === invitationId);
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

  const formatRole = (role) => role.replace('org:', '').replace('_', ' ').replace('basic ', '');

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
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '4px' }}>
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
          {error && <p style={{ fontSize: '12px', color: '#b97070', marginTop: '8px', fontWeight: 300 }}>{error}</p>}
          {success && <p style={{ fontSize: '12px', color: '#4B7263', marginTop: '8px', fontWeight: 300 }}>{success}</p>}
        </form>
      )}

      {/* Members list */}
      {(memberships?.data?.length > 0 || (isAdmin && invitations?.data?.length > 0)) && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '10px' }}>
            Members
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {memberships?.data?.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#E9E5DF', borderRadius: '5px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 400, color: '#1a1a1a' }}>{m.publicUserData.identifier}</div>
                  <div style={{ fontSize: '11px', fontWeight: 300, color: '#888', marginTop: '2px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{formatRole(m.role)}</span>
                    <span style={{ margin: '0 5px' }}>·</span>
                    <span style={{ color: '#4B7263' }}>Active</span>
                  </div>
                </div>
                {isAdmin && m.role !== 'org:admin' && (
                  <button
                    onClick={() => handleRemoveMember(m.publicUserData.userId)}
                    disabled={removingUserId === m.publicUserData.userId || isEditWindowExpired}
                    style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 300, color: '#b97070', cursor: removingUserId === m.publicUserData.userId || isEditWindowExpired ? 'not-allowed' : 'pointer', opacity: removingUserId === m.publicUserData.userId || isEditWindowExpired ? 0.5 : 1, fontFamily: 'Outfit, sans-serif' }}
                  >
                    {removingUserId === m.publicUserData.userId ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            ))}

            {isAdmin && invitations?.data?.map((inv) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#E9E5DF', borderRadius: '5px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 400, color: '#1a1a1a' }}>{inv.emailAddress}</div>
                  <div style={{ fontSize: '11px', fontWeight: 300, color: '#888', marginTop: '2px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{formatRole(inv.role)}</span>
                    <span style={{ margin: '0 5px' }}>·</span>
                    <span style={{ color: '#a08c3a' }}>Pending</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeInvitation(inv.id)}
                  disabled={revokingInvitationId === inv.id || isEditWindowExpired}
                  style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 300, color: '#b97070', cursor: revokingInvitationId === inv.id || isEditWindowExpired ? 'not-allowed' : 'pointer', opacity: revokingInvitationId === inv.id || isEditWindowExpired ? 0.5 : 1, fontFamily: 'Outfit, sans-serif' }}
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
