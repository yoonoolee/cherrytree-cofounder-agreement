import React from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { useCollaborators } from '../hooks/useCollaborators';

function ApprovalSection({ project, projectId }) {
  const { currentUser, loading } = useUser();
  const { collaboratorIds, getDisplayName, isAdmin } = useCollaborators(project);
  const currentUserId = currentUser?.id;
  const currentUserIsAdmin = isAdmin(currentUserId);

  // Don't render until auth state is loaded
  if (loading) {
    return null;
  }

  const approvals = project.approvals || {};

  // Count approvals (everyone must approve, including admin)
  const approvedCount = collaboratorIds.filter(userId => approvals[userId] === true).length;
  const totalRequired = collaboratorIds.length;
  const allApproved = totalRequired === 0 || approvedCount === totalRequired;

  const handleToggleApproval = async () => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const newStatus = !approvals[currentUserId];

      // Create a new approvals object with the updated status
      const updatedApprovals = {
        ...approvals,
        [currentUserId]: newStatus
      };

      await updateDoc(projectRef, {
        approvals: updatedApprovals
      });
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Failed to update approval status: ' + error.message);
    }
  };

  if (project.submitted) {
    return null;
  }

  // If only one collaborator (just the admin), don't show approval section
  if (collaboratorIds.length <= 1) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500">
          Add collaborators to enable the approval system.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        Approval Status
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {approvedCount} of {totalRequired} cofounders approved
      </p>

      {/* Warning if approvals were reset */}
      {project.lastEditedBy && approvedCount === 0 && totalRequired > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600">
            The survey was recently edited. All approvals have been reset. Please review and re-approve.
          </p>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {collaboratorIds.map((userId) => {
          const displayName = getDisplayName(userId);
          const isThisAdmin = isAdmin(userId);
          const isApproved = approvals[userId] === true;

          return (
            <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-700 font-medium text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-700">
                    {displayName}
                  </span>
                  {isThisAdmin && (
                    <span className="text-xs text-gray-500 ml-2">(Admin)</span>
                  )}
                </div>
              </div>

              <span className={`text-sm font-medium ${isApproved ? 'text-green-700' : 'text-gray-400'}`}>
                {isApproved ? 'Approved' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleToggleApproval}
        className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
          approvals[currentUserId]
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            : 'bg-black text-white hover:bg-[#1a1a1a]'
        }`}
      >
        {approvals[currentUserId] ? 'Revoke My Approval' : 'Approve Survey'}
      </button>

      {currentUserIsAdmin && !allApproved && (
        <p className="text-sm text-gray-500 mt-3">
          You cannot submit until all cofounders approve ({approvedCount}/{totalRequired}).
        </p>
      )}

      {currentUserIsAdmin && allApproved && totalRequired > 0 && (
        <p className="text-sm text-green-700 mt-3">
          All cofounders have approved. You can now submit.
        </p>
      )}
    </div>
  );
}

export default ApprovalSection;
