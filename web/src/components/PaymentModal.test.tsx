import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import PaymentModal from './PaymentModal.tsx';

const mocks = vi.hoisted(() => ({
  callFunction: vi.fn(),
  user: { currentUser: { id: 'user_admin' } as { id: string } | null, loading: false },
}));

vi.mock('../lib/functions', () => ({ callFunction: mocks.callFunction }));
vi.mock('../contexts/UserContext', () => ({ useUser: () => mocks.user }));
vi.mock('./ProWaitlistForm', () => ({
  default: ({ source }: { source: string }) => <div>waitlist:{source}</div>,
}));

const realLocation = window.location;

function renderModal(onClose = vi.fn()) {
  render(<PaymentModal onClose={onClose} />);
  return {
    onClose,
    nameInput: screen.getByPlaceholderText('Enter company name'),
    submit: screen.getByRole('button', { name: 'Continue to Payment' }),
  };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mocks.callFunction.mockReset();
  mocks.user = { currentUser: { id: 'user_admin' }, loading: false };
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: 'http://localhost:3000/dashboard' },
  });
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
});

describe('PaymentModal', () => {
  it('offers Starter (selected) and a disabled Pro card with the waitlist form', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Starter' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('waitlist:payment_modal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Starter/ })).toHaveClass('border-black');
  });

  it('wiggles instead of submitting an empty name', () => {
    const { nameInput, submit } = renderModal();
    fireEvent.click(submit);
    expect(nameInput).toHaveClass('animate-wiggle');
    expect(mocks.callFunction).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(500));
    expect(nameInput).not.toHaveClass('animate-wiggle');
  });

  it('rejects names over 100 characters and names with markup-like characters', () => {
    const { nameInput, submit } = renderModal();
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(101) } });
    fireEvent.click(submit);
    expect(screen.getByText('Company name must be less than 100 characters')).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: '<b>Acme</b>' } });
    fireEvent.click(submit);
    expect(screen.getByText('Company name contains invalid characters')).toBeInTheDocument();
    expect(mocks.callFunction).not.toHaveBeenCalled();
  });

  it('creates a checkout session for the trimmed name and selected plan, then leaves for Stripe', async () => {
    mocks.callFunction.mockResolvedValue({
      sessionId: 'cs_1',
      url: 'https://checkout.stripe.test/cs_1',
    });
    const { nameInput, submit } = renderModal();
    fireEvent.change(nameInput, { target: { value: '  Acme & Co  ' } });
    fireEvent.click(submit);
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
    await waitFor(() => expect(window.location.href).toBe('https://checkout.stripe.test/cs_1'));
    expect(mocks.callFunction).toHaveBeenCalledWith('createCheckoutSession', {
      plan: 'starter',
      projectName: 'Acme & Co',
    });
    // Nothing reads a payment marker after the round trip through Stripe.
    expect(sessionStorage.length).toBe(0);
  });

  it('surfaces the callable error and re-enables the button', async () => {
    mocks.callFunction.mockRejectedValue(new Error('Invalid project name'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { nameInput, submit } = renderModal();
    fireEvent.change(nameInput, { target: { value: 'Acme' } });
    fireEvent.click(submit);
    expect(await screen.findByText('Invalid project name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to Payment' })).toBeEnabled();
    expect(window.location.href).toBe('http://localhost:3000/dashboard');
    consoleError.mockRestore();
  });

  it('treats a missing checkout URL as a failure', async () => {
    mocks.callFunction.mockResolvedValue({ sessionId: 'cs_1', url: null });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { nameInput, submit } = renderModal();
    fireEvent.change(nameInput, { target: { value: 'Acme' } });
    fireEvent.click(submit);
    expect(await screen.findByText('Failed to create checkout session')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('refuses to start while the account is still loading', async () => {
    mocks.user = { currentUser: null, loading: true };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { nameInput, submit } = renderModal();
    fireEvent.change(nameInput, { target: { value: 'Acme' } });
    fireEvent.click(submit);
    expect(
      await screen.findByText('Please wait while we load your account...'),
    ).toBeInTheDocument();
    expect(mocks.callFunction).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('closes from × and the backdrop only', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('heading', { name: 'Start a New Cofounder Agreement' }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
