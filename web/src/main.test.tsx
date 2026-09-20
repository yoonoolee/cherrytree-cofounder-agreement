import type { ReactElement, ReactNode } from 'react';

const mocks = vi.hoisted(() => ({
  env: {
    isProd: false,
    enforceHttps: false,
    clerkPublishableKey: 'pk_test_123' as string | undefined,
    sentryDsn: '' as string | undefined,
  },
  render: vi.fn(),
  createRoot: vi.fn(),
  sentryInit: vi.fn(),
  clerkProps: null as null | Record<string, unknown>,
  toasterProps: null as null | Record<string, unknown>,
}));

vi.mock('./lib/env', () => ({ env: mocks.env }));
vi.mock('./lib/env.ts', () => ({ env: mocks.env }));
vi.mock('react-dom/client', () => ({
  default: { createRoot: mocks.createRoot },
  createRoot: mocks.createRoot,
}));
vi.mock('@sentry/react', () => ({ init: mocks.sentryInit }));
vi.mock('@clerk/react', () => ({
  ClerkProvider: (props: Record<string, unknown> & { children: ReactNode }) => {
    mocks.clerkProps = props;
    return <div data-testid="clerk">{props.children}</div>;
  },
}));
vi.mock('react-hot-toast', () => ({
  Toaster: (props: Record<string, unknown>) => {
    mocks.toasterProps = props;
    return <div data-testid="toaster" />;
  },
}));
vi.mock('./contexts/UserContext', () => ({
  UserProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="user-provider">{children}</div>
  ),
}));
vi.mock('./App', () => ({ default: () => <div data-testid="app" /> }));

const realLocation = window.location;

/** Imports the entry module afresh (it runs at import time). */
async function boot() {
  vi.resetModules();
  await import('./main.tsx');
}

/** The element tree handed to root.render, walked to a flat list of element types/test ids. */
function renderedTree() {
  const element = mocks.render.mock.calls[0]?.[0] as ReactElement;
  return element;
}

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  mocks.env.isProd = false;
  mocks.env.enforceHttps = false;
  mocks.env.clerkPublishableKey = 'pk_test_123';
  mocks.env.sentryDsn = '';
  mocks.render.mockReset();
  mocks.createRoot.mockReset().mockReturnValue({ render: mocks.render });
  mocks.sentryInit.mockReset();
  mocks.clerkProps = null;
  mocks.toasterProps = null;
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
});

describe('main', () => {
  it('mounts Clerk → UserProvider → App + Toaster into #root', async () => {
    const { render } = await import('@testing-library/react');
    await boot();
    expect(mocks.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(mocks.render).toHaveBeenCalledTimes(1);

    render(renderedTree());
    expect(mocks.clerkProps).toMatchObject({
      publishableKey: 'pk_test_123',
      signInUrl: '/login',
      signUpUrl: '/signup',
      signInFallbackRedirectUrl: '/dashboard',
      signUpFallbackRedirectUrl: '/dashboard',
    });
    const clerk = document.querySelector('[data-testid="clerk"]')!;
    const provider = clerk.querySelector('[data-testid="user-provider"]')!;
    expect(provider.querySelector('[data-testid="app"]')).not.toBeNull();
    expect(provider.querySelector('[data-testid="toaster"]')).not.toBeNull();
    expect(mocks.toasterProps).toMatchObject({ position: 'bottom-right' });
  });

  it('refuses to start without a #root element', async () => {
    document.body.innerHTML = '';
    await expect(boot()).rejects.toThrow('index.html has no #root element');
    expect(mocks.render).not.toHaveBeenCalled();
  });

  it('refuses to start without the Clerk publishable key', async () => {
    mocks.env.clerkPublishableKey = undefined;
    await expect(boot()).rejects.toThrow('Missing Clerk Publishable Key');
    expect(mocks.render).not.toHaveBeenCalled();
  });

  it('initialises Sentry only when a DSN is configured, tagged with the environment', async () => {
    await boot();
    expect(mocks.sentryInit).not.toHaveBeenCalled();

    mocks.env.sentryDsn = 'https://key@sentry.io/1';
    mocks.env.isProd = true;
    await boot();
    expect(mocks.sentryInit).toHaveBeenCalledWith({
      dsn: 'https://key@sentry.io/1',
      environment: 'production',
      tracesSampleRate: 0.1,
    });
  });

  it('upgrades an http: page to https: only in production with the flag on', async () => {
    const fake = { protocol: 'http:', href: 'http://cherrytree.app/pricing' };
    Object.defineProperty(window, 'location', { configurable: true, value: fake });

    mocks.env.enforceHttps = true;
    await boot();
    expect(fake.href).toBe('http://cherrytree.app/pricing'); // dev build: untouched

    mocks.env.isProd = true;
    await boot();
    expect(fake.href).toBe('https://cherrytree.app/pricing');
  });
});
