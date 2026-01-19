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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          💡 Add collaborators to enable the approval system
        </p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📋 Approval Status ({approvedCount}/{totalRequired})
      </h3>

      {/* Warning if approvals were reset */}
      {project.lastEditedBy && approvedCount === 0 && totalRequired > 0 && (
        <div className="bg-black border border-black rounded-lg p-3 mb-4">
          <p className="text-sm text-white">
            ⚠️ The survey was recently edited. All approvals have been reset. Please review and re-approve.
          </p>
        </div>
      )}
      
      <div className="space-y-3 mb-4">
        {collaboratorIds.map((userId) => {
          const displayName = getDisplayName(userId);
          const isThisAdmin = isAdmin(userId);
          const isCurrentUser = userId === currentUserId;

          return (
            <div key={userId} className="flex items-center justify-between bg-white rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-950 font-medium text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-700">
                    {displayName}
                  </span>
                  {isThisAdmin && (
                    <span className="text-xs text-gray-500 ml-2">(Admin)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {approvals[userId] ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    ✓ Approved
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center gap-1">
                    ⏳ Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleToggleApproval}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          approvals[currentUserId]
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {approvals[currentUserId] ? 'Revoke My Approval' : 'Approve Survey'}
      </button>

      {currentUserIsAdmin && !allApproved && (
        <div className="bg-black border border-black rounded-lg p-3 mt-4">
          <p className="text-sm text-white">
            ⚠️ You cannot submit until everyone approves ({approvedCount}/{totalRequired} approved)
          </p>
        </div>
      )}

      {currentUserIsAdmin && allApproved && totalRequired > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-green-800">
            ✓ Everyone has approved! You can now submit.
          </p>
        </div>
      )}
    </div>
  );
}

export default ApprovalSection;