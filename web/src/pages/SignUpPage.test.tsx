import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { breadcrumbs } from '../test/pageMeta.ts';
import SignUpPage from './SignUpPage.tsx';

const mocks = vi.hoisted(() => ({ signUpProps: null as null | Record<string, unknown> }));

vi.mock('@clerk/react', () => ({
  SignUp: (props: Record<string, unknown>) => {
    mocks.signUpProps = props;
    return <div data-testid="sign-up" />;
  },
}));

function renderPage(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <SignUpPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.signUpProps = null;
});

describe('SignUpPage', () => {
  it('sets the page meta', () => {
    renderPage('/signup');
    expect(document.title).toBe('Sign Up | Cherrytree');
    expect(breadcrumbs()).toEqual(['Home', 'Sign Up']);
  });

  it("renders Clerk's SignUp with path routing under /signup and the dashboard as the landing page", () => {
    renderPage('/signup');
    expect(screen.getByTestId('sign-up')).toBeInTheDocument();
    expect(mocks.signUpProps).toMatchObject({
      routing: 'path',
      path: '/signup',
      signInUrl: '/login',
      fallbackRedirectUrl: '/dashboard',
    });
  });

  it('forwards an invitation ticket to the sign-in link', () => {
    renderPage('/signup?__clerk_ticket=tkt_123');
    expect(mocks.signUpProps?.signInUrl).toBe('/login?__clerk_ticket=tkt_123');
  });
});
