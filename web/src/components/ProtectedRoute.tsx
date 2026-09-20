import type { ReactNode } from 'react';
import { Show, RedirectToSignIn } from '@clerk/react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <Show when="signed-in" fallback={<RedirectToSignIn />}>
      {children}
    </Show>
  );
}

export default ProtectedRoute;
