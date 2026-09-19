import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ProtectedRoute from './ProtectedRoute.tsx';

const mocks = vi.hoisted(() => ({ signedIn: true }));

vi.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }: { children: ReactNode }) => (mocks.signedIn ? children : null),
  SignedOut: ({ children }: { children: ReactNode }) => (mocks.signedIn ? null : children),
  RedirectToSignIn: () => <div>redirecting to sign in</div>,
}));

describe('ProtectedRoute', () => {
  it('renders its children for a signed-in user', () => {
    mocks.signedIn = true;
    render(
      <ProtectedRoute>
        <div>dashboard</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText('redirecting to sign in')).toBeNull();
  });

  it('redirects a signed-out user instead of rendering children', () => {
    mocks.signedIn = false;
    render(
      <ProtectedRoute>
        <div>dashboard</div>
      </ProtectedRoute>,
    );
    expect(screen.queryByText('dashboard')).toBeNull();
    expect(screen.getByText('redirecting to sign in')).toBeInTheDocument();
  });
});
