import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { breadcrumbs } from '../test/pageMeta.ts';
import LoginPage from './LoginPage.tsx';

const mocks = vi.hoisted(() => ({ signInProps: null as null | Record<string, unknown> }));

vi.mock('@clerk/clerk-react', () => ({
  SignIn: (props: Record<string, unknown>) => {
    mocks.signInProps = props;
    return <div data-testid="sign-in" />;
  },
}));

function renderPage(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LoginPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.signInProps = null;
});

describe('LoginPage', () => {
  it('sets the page meta', () => {
    renderPage('/login');
    expect(document.title).toBe('Login | Cherrytree');
    expect(breadcrumbs()).toEqual(['Home', 'Login']);
  });

  it("renders Clerk's SignIn with virtual routing and the dashboard as the landing page", () => {
    renderPage('/login');
    expect(screen.getByTestId('sign-in')).toBeInTheDocument();
    expect(mocks.signInProps).toMatchObject({
      routing: 'virtual',
      signUpUrl: '/signup',
      fallbackRedirectUrl: '/dashboard',
    });
  });

  it('forwards an invitation ticket to the sign-up link', () => {
    renderPage('/login?__clerk_ticket=tkt_123');
    expect(mocks.signInProps?.signUpUrl).toBe('/signup?__clerk_ticket=tkt_123');
  });
});
