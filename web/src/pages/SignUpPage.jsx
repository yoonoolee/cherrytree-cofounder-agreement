import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { useSearchParams } from 'react-router-dom';

function SignUpPage() {
  const [searchParams] = useSearchParams();
  const ticket = searchParams.get('__clerk_ticket');

  usePageMeta({
    title: 'Sign Up | Cherrytree',
    description: 'Create your Cherrytree account to start building your cofounder agreement.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Sign Up' }
    ]
  });

  // Preserve ticket when switching to login
  const signInUrl = ticket ? `/login?__clerk_ticket=${ticket}` : '/login';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <SignUp
          routing="virtual"
          signInUrl={signInUrl}
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

export default SignUpPage;
