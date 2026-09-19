import type { ReactNode } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default ProtectedRoute;
