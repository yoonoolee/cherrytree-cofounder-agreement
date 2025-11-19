import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

function AppRedirect() {
  const navigate = useNavigate();
  const { currentUser, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        // Logged in: go to dashboard (which redirects to latest project)
        navigate('/dashboard');
      } else {
        // Not logged in: go to login page
        navigate('/login');
      }
    }
  }, [currentUser, loading, navigate]);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // After navigation completes, return null
  return null;
}

export default AppRedirect;
