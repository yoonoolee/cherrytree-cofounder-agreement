import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import AcceptInvitePage from './AcceptInvitePage.tsx';

const mocks = vi.hoisted(() => ({
  clerk: {
    loaded: true,
    session: null as null | { id: string },
    signOut: vi.fn(),
  },
}));

vi.mock('@clerk/react', () => ({ useClerk: () => mocks.clerk }));

function Location() {
  const { pathname, search } = useLocation();
  return <p data-testid="path">{pathname + search}</p>;
}

function renderPage(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="*" element={<div>elsewhere</div>} />
      </Routes>
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

const path = () => screen.getByTestId('path').textContent;
const INVITE = '/accept-invite?__clerk_ticket=tkt_123';

beforeEach(() => {
  mocks.clerk.loaded = true;
  mocks.clerk.session = null;
  mocks.clerk.signOut = vi.fn().mockResolvedValue(undefined);
});

describe('AcceptInvitePage', () => {
  it('waits, showing the spinner, until Clerk has loaded', () => {
    mocks.clerk.loaded = false;
    renderPage(INVITE);
    expect(screen.getByText('Joining project...')).toBeInTheDocument();
    expect(path()).toBe(INVITE);
    expect(mocks.clerk.signOut).not.toHaveBeenCalled();
  });

  it('sends a visitor without a ticket to the dashboard', () => {
    renderPage('/accept-invite');
    expect(path()).toBe('/dashboard');
    expect(mocks.clerk.signOut).not.toHaveBeenCalled();
  });

  it('sends a signed-out visitor to the login page with the ticket', async () => {
    renderPage(INVITE);
    await act(async () => {});
    expect(path()).toBe('/login?__clerk_ticket=tkt_123');
    expect(mocks.clerk.signOut).not.toHaveBeenCalled();
  });

  it('signs a signed-in visitor out first, landing on the login page with the ticket', async () => {
    mocks.clerk.session = { id: 'sess_1' };
    renderPage(INVITE);
    await act(async () => {});
    expect(mocks.clerk.signOut).toHaveBeenCalledWith({
      redirectUrl: '/login?__clerk_ticket=tkt_123',
    });
    expect(path()).toBe(INVITE); // Clerk performs the redirect itself
  });

  it('still sends a signed-in visitor to the login page when signing out fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.clerk.session = { id: 'sess_1' };
    mocks.clerk.signOut = vi.fn().mockRejectedValue(new Error('offline'));
    renderPage(INVITE);
    await act(async () => {});
    expect(error).toHaveBeenCalledWith(
      'Error signing out before accepting the invite:',
      expect.any(Error),
    );
    expect(path()).toBe('/login?__clerk_ticket=tkt_123');
    error.mockRestore();
  });
});
