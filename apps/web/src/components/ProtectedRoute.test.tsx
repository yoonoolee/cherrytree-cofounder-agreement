import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ProtectedRoute from './ProtectedRoute.tsx';

const mocks = vi.hoisted(() => ({ signedIn: true, loaded: true }));

vi.mock('@clerk/react', () => ({
  ClerkLoading: ({ children }: { children: ReactNode }) => (mocks.loaded ? null : children),
  ClerkLoaded: ({ children }: { children: ReactNode }) => (mocks.loaded ? children : null),
  Show: ({ children, fallback }: { children: ReactNode; fallback: ReactNode }) =>
    mocks.signedIn ? children : fallback,
  RedirectToSignIn: () => <div>redirecting to sign in</div>,
}));

beforeEach(() => {
  mocks.loaded = true;
});

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

  it('shows its loading view until Clerk has loaded', () => {
    mocks.loaded = false;
    render(
      <ProtectedRoute loading={<div>skeleton</div>}>
        <div>dashboard</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('skeleton')).toBeInTheDocument();
    expect(screen.queryByText('dashboard')).toBeNull();
    expect(screen.queryByText('redirecting to sign in')).toBeNull();
  });
});
