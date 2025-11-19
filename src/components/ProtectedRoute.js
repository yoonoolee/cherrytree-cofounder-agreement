import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Check if we're in the middle of logging out
    const isLoggingOut = sessionStorage.getItem('isLoggingOut');
    if (isLoggingOut) {
      return null; // Don't redirect, just show nothing
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
