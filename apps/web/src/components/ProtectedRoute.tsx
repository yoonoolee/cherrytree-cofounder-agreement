import type { ReactNode } from 'react';
import { ClerkLoaded, ClerkLoading, RedirectToSignIn, Show } from '@clerk/react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Shown while Clerk loads, before it knows whether anyone is signed in. */
  loading?: ReactNode;
}

function ProtectedRoute({
  children,
  loading = <div className="min-h-screen bg-paper" />,
}: ProtectedRouteProps) {
  return (
    <>
      <ClerkLoading>{loading}</ClerkLoading>
      <ClerkLoaded>
        <Show when="signed-in" fallback={<RedirectToSignIn />}>
          {children}
        </Show>
      </ClerkLoaded>
    </>
  );
}

export default ProtectedRoute;
