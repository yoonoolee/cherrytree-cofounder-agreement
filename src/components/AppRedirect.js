import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

function AppRedirect() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Logged in: go to dashboard (which redirects to latest project)
        navigate('/dashboard');
      } else {
        // Not logged in: go to login page
        navigate('/login');
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Show loading screen while checking auth
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default AppRedirect;
