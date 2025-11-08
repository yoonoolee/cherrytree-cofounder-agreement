import React, { useState } from 'react';
import { db, auth, functions } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions'; 

function CollaboratorManager({ project }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = project.ownerEmail === auth.currentUser?.email;

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (email === project.ownerEmail) {
      setError("You're already the owner of this project");
      return;
    }

    if (project.collaborators?.includes(email)) {
      setError('This person is already a collaborator');
      return;
    }

    setLoading(true);

    try {
      const projectRef = doc(db, 'projects', project.id);
      
      // Add email to collaborators array and initialize approval
      await updateDoc(projectRef, {
        collaborators: arrayUnion(email),
        [`approvals.${email}`]: false
      });

      // Send invitation email
      try {
        const sendInvite = httpsCallable(functions, 'sendCollaboratorInvite');
        await sendInvite({
          projectId: project.id,
          collaboratorEmail: email,
          projectName: project.name
        });
        setSuccess(`✓ Invitation email sent to ${email}`);
      } catch (emailError) {
        console.error('Email error:', emailError);
        setSuccess(`✓ ${email} added (email may not have been delivered)`);
      }

      setEmail('');
      
    } catch (err) {
      console.error('Error adding collaborator:', err);
      setError('Failed to add collaborator. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorEmail) => {
    if (!window.confirm(`Remove ${collaboratorEmail} from this project?`)) {
      return;
    }

    try {
      const projectRef = doc(db, 'projects', project.id);
      
      // Remove from collaborators array
      await updateDoc(projectRef, {
        collaborators: arrayRemove(collaboratorEmail)
      });

      // Remove their approval status
      await updateDoc(projectRef, {
        [`approvals.${collaboratorEmail}`]: null
      });

      setSuccess(`✓ Removed ${collaboratorEmail}`);
    } catch (err) {
      console.error('Error removing collaborator:', err);
      setError('Failed to remove collaborator. Please try again.');
    }
  };

  if (!isOwner) {
    // Show read-only list for non-owners
    return (
      <div>
        <div className="space-y-3">
          {project.collaborators?.map((collab, index) => (
            <div key={index} className="flex items-center gap-3 py-2">
              <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {collab.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-sm">{collab}</p>
                {collab === project.ownerEmail && (
                  <p className="text-xs text-gray-500">Owner</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Note about cofounders */}
      <p className="text-sm text-gray-700 font-medium mb-4">
        Note: All cofounders must be added as collaborators.
      </p>

      {/* Add Collaborator Form */}
      <form onSubmit={handleAddCollaborator} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add by email
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-2 rounded text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Success/Error Messages */}
      {error && (
        <p className="text-xs text-red-600 mb-4">{error}</p>
      )}
      {success && (
        <p className="text-xs text-gray-600 mb-4">{success}</p>
      )}

      {/* Collaborators List */}
      <div className="space-y-1">
        {project.collaborators?.map((collab, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {collab.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-gray-900 text-sm">{collab}</p>
                {collab === project.ownerEmail && (
                  <p className="text-xs text-gray-500">Owner</p>
                )}
              </div>
            </div>

            {collab !== project.ownerEmail && (
              <button
                onClick={() => handleRemoveCollaborator(collab)}
                className="text-red-700 hover:text-red-900 text-xs font-medium"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Collaborators can view and edit this document, but only the owner can submit it.
      </p>
    </div>
  );
}

export default CollaboratorManager;