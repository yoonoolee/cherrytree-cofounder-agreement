import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Auth from '../components/Auth';

function LoginPage() {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogin = () => {
    navigate('/dashboard', { replace: true });
  };

  return <Auth onLogin={handleLogin} />;
}

export default LoginPage;
