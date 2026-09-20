import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import App from './App.tsx';

// Every page has its own tests; each stub renders its name so the route table can be checked.
const { stub } = vi.hoisted(() => ({
  stub: (name: string) => ({ default: () => <div data-testid="page">{name}</div> }),
}));
vi.mock('./pages/LandingPage', () => stub('LandingPage'));
vi.mock('./pages/EquityCalculatorPage', () => stub('EquityCalculatorPage'));
vi.mock('./pages/AttorneyPage', () => stub('AttorneyPage'));
vi.mock('./pages/PricingPage', () => stub('PricingPage'));
vi.mock('./pages/AboutPage', () => stub('AboutPage'));
vi.mock('./pages/ContactPage', () => stub('ContactPage'));
vi.mock('./pages/PrivacyPage', () => stub('PrivacyPage'));
vi.mock('./pages/TermsPage', () => stub('TermsPage'));
vi.mock('./pages/LoginPage', () => stub('LoginPage'));
vi.mock('./pages/SignUpPage', () => stub('SignUpPage'));
vi.mock('./pages/AcceptInvitePage', () => stub('AcceptInvitePage'));
vi.mock('./pages/DashboardPage', () => stub('DashboardPage'));
vi.mock('./pages/SurveyPage', () => stub('SurveyPage'));
vi.mock('./pages/PreviewPage', () => stub('PreviewPage'));
vi.mock('./pages/FinalAgreementPage', () => stub('FinalAgreementPage'));
vi.mock('./components/ProtectedRoute', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="protected">{children}</div>,
}));
vi.mock('./components/ResetPagePosition', () => ({
  default: () => <div data-testid="reset-page-position" />,
}));

function renderAt(url: string) {
  window.history.pushState({}, '', url);
  return render(<App />);
}

const page = () => screen.getByTestId('page').textContent;
const isProtected = () => screen.queryByTestId('protected') !== null;

describe('App', () => {
  it.each([
    ['/', 'LandingPage'],
    ['/equity-calculator', 'EquityCalculatorPage'],
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
    ['/accept-invite', 'AcceptInvitePage'],
  ])('serves %s publicly as %s', (url, name) => {
    renderAt(url);
    expect(page()).toBe(name);
    expect(isProtected()).toBe(false);
    expect(screen.getByTestId('reset-page-position')).toBeInTheDocument();
  });

  it.each([
    ['/dashboard', 'DashboardPage'],
    ['/survey/org_1', 'SurveyPage'],
    ['/preview/org_1', 'PreviewPage'],
    ['/final-agreement/org_1', 'FinalAgreementPage'],
  ])('serves %s behind ProtectedRoute as %s', (url, name) => {
    renderAt(url);
    expect(page()).toBe(name);
    expect(isProtected()).toBe(true);
  });

  it('renders nothing for an unknown path', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderAt('/nope');
    expect(screen.queryByTestId('page')).toBeNull();
    warn.mockRestore();
  });
});
