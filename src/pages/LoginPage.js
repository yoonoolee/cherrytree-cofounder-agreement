import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { useSearchParams } from 'react-router-dom';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const ticket = searchParams.get('__clerk_ticket');

  usePageMeta({
    title: 'Login | Cherrytree',
    description: 'Login to Cherrytree to access your cofounder agreements and manage your equity splits.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Login' }
    ]
  });

  // Preserve ticket when switching to signup
  const signUpUrl = ticket ? `/signup?__clerk_ticket=${ticket}` : '/signup';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <SignIn
          routing="virtual"
          signUpUrl={signUpUrl}
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg'
            }
          }}
        />
      </div>
    </div>
  );
}

export default LoginPage;
