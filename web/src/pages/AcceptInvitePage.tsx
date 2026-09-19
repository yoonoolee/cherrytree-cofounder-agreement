import { useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { CLERK_TICKET_PARAM, withClerkTicket } from '../utils/clerkTicket.ts';

/**
 * Accept Invite Page
 *
 * Handles organization invitation acceptance by redirecting to login/signup.
 * If user is already logged in, signs them out first to ensure ticket is processed.
 * Clerk's SignIn/SignUp components automatically handle the __clerk_ticket parameter.
 */
function AcceptInvitePage() {
  const { loaded, session, signOut } = useClerk();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!loaded) return;

    const ticket = searchParams.get(CLERK_TICKET_PARAM);

    if (!ticket) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const loginUrl = withClerkTicket('/login', ticket);
    const handleInvite = async () => {
      if (session) {
        await signOut({ redirectUrl: loginUrl });
      } else {
        navigate(loginUrl, { replace: true });
      }
    };

    handleInvite();
  }, [loaded, session, signOut, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
        <p className="text-lg text-gray-700">Joining project...</p>
      </div>
    </div>
  );
}

export default AcceptInvitePage;
