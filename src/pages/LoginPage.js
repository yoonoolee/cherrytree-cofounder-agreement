import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import Auth from '../components/Auth';

function LoginPage() {
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = () => {
    navigate('/dashboard');
  };

  return <Auth onLogin={handleLogin} />;
}

export default LoginPage;
