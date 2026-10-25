import { goToDashboard } from './goToDashboard.ts';

vi.mock('../lib/env', () => ({ env: { appUrl: 'https://my.cherrytree.app' } }));

describe('goToDashboard', () => {
  const realLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
  });

  it('uses the router off the production host', () => {
    const navigate = vi.fn();
    goToDashboard(navigate);
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('leaves for the app host from a cherrytree.app marketing page', () => {
    const fake = { hostname: 'cherrytree.app', href: 'https://cherrytree.app/' };
    Object.defineProperty(window, 'location', { configurable: true, value: fake });
    const navigate = vi.fn();
    goToDashboard(navigate);
    expect(navigate).not.toHaveBeenCalled();
    expect(fake.href).toBe('https://my.cherrytree.app/dashboard');
  });

  it('treats the app host itself as production too', () => {
    const fake = { hostname: 'my.cherrytree.app', href: 'https://my.cherrytree.app/pricing' };
    Object.defineProperty(window, 'location', { configurable: true, value: fake });
    goToDashboard(vi.fn());
    expect(fake.href).toBe('https://my.cherrytree.app/dashboard');
  });
});
