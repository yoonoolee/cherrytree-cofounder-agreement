import { SignUp } from '@clerk/react';
import { useSearchParams } from 'react-router-dom';

import { usePageMeta } from '../hooks/usePageMeta.ts';
import { CLERK_TICKET_PARAM, withClerkTicket } from '../utils/clerkTicket.ts';

function SignUpPage() {
  const [searchParams] = useSearchParams();
  const ticket = searchParams.get(CLERK_TICKET_PARAM);

  usePageMeta({
    title: 'Sign Up | Cherrytree',
    description: 'Create your Cherrytree account to start building your cofounder agreement.',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Sign Up' }],
  });

  // Preserve ticket when switching to login
  const signInUrl = withClerkTicket('/login', ticket);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <SignUp
          routing="path"
          path="/signup"
          signInUrl={signInUrl}
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

export default SignUpPage;
