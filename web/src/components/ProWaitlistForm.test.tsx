import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ProWaitlistForm from './ProWaitlistForm.tsx';

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  serverTimestamp: () => ({ kind: 'serverTimestamp' }),
}));

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ path: name }),
  addDoc: mocks.addDoc,
  serverTimestamp: mocks.serverTimestamp,
}));
vi.mock('../lib/firebase', () => ({
  db: {},
  proWaitlist: { path: 'proWaitlist' },
}));

beforeEach(() => {
  mocks.addDoc.mockReset().mockResolvedValue({ id: 'doc_1' });
});

describe('ProWaitlistForm', () => {
  it('rejects an invalid email without writing', () => {
    render(<ProWaitlistForm source="pricing" />);
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });

  it('writes exactly { email, timestamp, source } with the email lower-cased and trimmed', async () => {
    render(<ProWaitlistForm source="upgrade_modal" />);
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: '  Ada@Example.com ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    await screen.findByText("✓ Thanks! We'll email you when Pro is available");
    expect(mocks.addDoc).toHaveBeenCalledTimes(1);
    expect(mocks.addDoc.mock.calls[0]![0]).toEqual({ path: 'proWaitlist' });
    expect(mocks.addDoc.mock.calls[0]![1]).toEqual({
      email: 'ada@example.com',
      timestamp: { kind: 'serverTimestamp' },
      source: 'upgrade_modal',
    });
  });

  it('submits on Enter and defaults the source to "unknown"', async () => {
    render(<ProWaitlistForm />);
    const input = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(input, { target: { value: 'ada@example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(mocks.addDoc).toHaveBeenCalledTimes(1));
    expect(mocks.addDoc.mock.calls[0]![1]).toMatchObject({ source: 'unknown' });
  });

  it('shows an error and keeps the email when the write fails', async () => {
    mocks.addDoc.mockRejectedValueOnce(new Error('offline'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ProWaitlistForm source="pricing" />);
    const input = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(input, { target: { value: 'ada@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(
      await screen.findByText('Failed to join waitlist. Please try again.'),
    ).toBeInTheDocument();
    expect(input).toHaveValue('ada@example.com');
    expect(screen.getByRole('button', { name: 'Join' })).toBeEnabled();
    consoleError.mockRestore();
  });

  it('ignores a second submit while the first is in flight', async () => {
    let resolveWrite: (value: unknown) => void = () => {};
    mocks.addDoc.mockImplementationOnce(() => new Promise((resolve) => (resolveWrite = resolve)));
    render(<ProWaitlistForm source="pricing" />);
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(await screen.findByRole('button', { name: 'Joining...' })).toBeDisabled();
    fireEvent.keyDown(screen.getByPlaceholderText('your@email.com'), { key: 'Enter' });
    expect(mocks.addDoc).toHaveBeenCalledTimes(1);
    resolveWrite({ id: 'doc_1' });
    await screen.findByText(/Thanks!/);
  });
});
