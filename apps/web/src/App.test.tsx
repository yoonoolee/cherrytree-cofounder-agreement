import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

// Every page has its own tests; each stub renders its name so the route table can be checked.
const { stub } = vi.hoisted(() => ({
  stub: (name: string) => ({ default: () => <div data-testid="page">{name}</div> }),
}));
vi.mock('./pages/LandingPage', () => stub('LandingPage'));
vi.mock('./pages/AttorneyPage', () => stub('AttorneyPage'));
vi.mock('./pages/PricingPage', () => stub('PricingPage'));
vi.mock('./pages/AboutPage', () => stub('AboutPage'));
vi.mock('./pages/ContactPage', () => stub('ContactPage'));
vi.mock('./pages/PrivacyPage', () => stub('PrivacyPage'));
vi.mock('./pages/TermsPage', () => stub('TermsPage'));
vi.mock('./pages/LoginPage', () => stub('LoginPage'));
vi.mock('./pages/SignUpPage', () => stub('SignUpPage'));
vi.mock('./pages/DashboardPage', () => stub('DashboardPage'));
vi.mock('./pages/ProjectPage', () => stub('ProjectPage'));
vi.mock('./components/ProtectedRoute', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="protected">{children}</div>,
}));

beforeEach(() => {
  // ScrollRestoration scrolls on every navigation; jsdom doesn't implement scrolling.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  // The router reads the URL when App.tsx loads, so each test loads it fresh.
  vi.resetModules();
});

async function renderAt(url: string) {
  window.history.pushState({}, '', url);
  const { default: App } = await import('./App.tsx');
  return render(<App />);
}

const page = () => screen.getByTestId('page').textContent;
const isProtected = () => screen.queryByTestId('protected') !== null;

describe('App', () => {
  it.each([
    ['/', 'LandingPage'],
    ['/attorney', 'AttorneyPage'],
    ['/pricing', 'PricingPage'],
    ['/about', 'AboutPage'],
    ['/contact', 'ContactPage'],
    ['/privacy', 'PrivacyPage'],
    ['/terms', 'TermsPage'],
    ['/login', 'LoginPage'],
    ['/login/factor-one', 'LoginPage'],
    ['/signup', 'SignUpPage'],
    ['/signup/verify-email-address', 'SignUpPage'],
  ])('serves %s publicly as %s', async (url, name) => {
    await renderAt(url);
    expect(page()).toBe(name);
    expect(isProtected()).toBe(false);
  });

  it.each([
    ['/dashboard', 'DashboardPage'],
    ['/projects/org_1', 'ProjectPage'],
  ])('serves %s behind ProtectedRoute as %s', async (url, name) => {
    await renderAt(url);
    expect(await screen.findByTestId('page')).toHaveTextContent(name);
    expect(isProtected()).toBe(true);
  });

  it('sends an unknown path to the landing page', async () => {
    await renderAt('/nope');
    expect(await screen.findByTestId('page')).toHaveTextContent('LandingPage');
  });
});
