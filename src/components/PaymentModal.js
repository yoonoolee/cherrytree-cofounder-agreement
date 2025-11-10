import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function PaymentModal({ onClose, onSuccess }) {
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWiggling, setIsWiggling] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setIsWiggling(true);
      setTimeout(() => setIsWiggling(false), 500);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to create a project');
      }

      // Create project directly in Firestore
      const projectData = {
        name: projectName.trim(),
        ownerId: currentUser.uid,
        ownerEmail: currentUser.email,
        collaborators: [currentUser.email],
        collaboratorIds: [currentUser.uid],
        approvals: {
          [currentUser.email]: true
        },
        requiresApprovals: true,
        surveyData: {
          companyName: projectName.trim()
        },
        activeUsers: [],
        submitted: false,
        submittedAt: null,
        submittedBy: null,
        pdfUrl: null,
        pdfGeneratedAt: null,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'projects'), projectData);
      onSuccess(docRef.id);

    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200/50 max-w-md w-full p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Start a New Cofounder Agreement</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={`w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:border-black focus:ring-0 bg-transparent text-gray-900 ${isWiggling ? 'animate-wiggle' : ''}`}
              placeholder="Enter company name"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Agreement'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;
