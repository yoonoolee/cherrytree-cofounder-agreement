import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Auth from '../components/Auth';
import { usePageMeta } from '../hooks/usePageMeta';

function LoginPage() {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  // SEO meta tags for login page
  usePageMeta({
    title: 'Login | Cherrytree',
    description: 'Login to Cherrytree to access your cofounder agreements and manage your equity splits.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Login' }
    ]
  });

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
