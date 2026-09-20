import { SignIn } from '@clerk/react';
import { useSearchParams } from 'react-router-dom';

import { usePageMeta } from '../hooks/usePageMeta.ts';
import { CLERK_TICKET_PARAM, withClerkTicket } from '../utils/clerkTicket.ts';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const ticket = searchParams.get(CLERK_TICKET_PARAM);

  usePageMeta({
    title: 'Login | Cherrytree',
    description:
      'Login to Cherrytree to access your cofounder agreements and manage your equity splits.',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Login' }],
  });

  // Preserve ticket when switching to signup
  const signUpUrl = withClerkTicket('/signup', ticket);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <SignIn
          routing="path"
          path="/login"
          signUpUrl={signUpUrl}
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            },
          }}
        />
      </div>
    </div>
  );
}

export default LoginPage;
