import { act, fireEvent, render, screen } from '@testing-library/react';
import { FunctionsError } from 'firebase/functions';

import { breadcrumbs } from '../test/pageMeta.ts';
import ContactPage from './ContactPage.tsx';

const { callFunction } = vi.hoisted(() => ({ callFunction: vi.fn() }));

vi.mock('../lib/functions', () => ({ callFunction }));
// The marketing chrome has its own tests.
vi.mock('../components/MarketingNav', () => ({ default: () => <nav data-testid="nav" /> }));
vi.mock('../components/MarketingFooter', () => ({
  default: () => <footer data-testid="footer" />,
}));
vi.mock('../components/MarketingGrain', () => ({ default: () => <svg data-testid="grain" /> }));

const FALLBACK =
  'Something went wrong sending your message. Please try again or email us directly at hello@cherrytree.app.';

const name = () => screen.getByLabelText('Name') as HTMLInputElement;
const email = () => screen.getByLabelText('Email') as HTMLInputElement;
const message = () => screen.getByLabelText('Message') as HTMLTextAreaElement;
const sendButton = () => screen.getByRole('button', { name: /Send message|Sending…/ });

function fillForm() {
  fireEvent.change(name(), { target: { value: '  Alex Chen ' } });
  fireEvent.change(email(), { target: { value: ' alex@startup.co ' } });
  fireEvent.change(message(), { target: { value: ' Hello there ' } });
}

/** Submits and resolves the mocked call's microtasks. */
async function submit() {
  await act(async () => {
    fireEvent.click(sendButton());
  });
}

beforeEach(() => {
  callFunction.mockReset();
});

describe('ContactPage', () => {
  it('sets the page meta', () => {
    render(<ContactPage />);
    expect(document.title).toBe('Contact Us — Cherrytree');
    expect(breadcrumbs()).toEqual(['Home', 'Contact']);
  });

  it('renders the hero, an empty form and the marketing chrome', () => {
    render(<ContactPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Get in touch.');
    expect(name()).toHaveValue('');
    expect(email()).toHaveValue('');
    expect(message()).toHaveValue('');
    expect(sendButton()).toBeEnabled();
    expect(sendButton()).toHaveTextContent('Send message');
    expect(screen.getByTestId('grain')).toBeInTheDocument();
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('sends the trimmed fields, then swaps the form for the confirmation', async () => {
    let resolveCall: (value: { success: true }) => void = () => {};
    callFunction.mockReturnValue(new Promise((resolve) => (resolveCall = resolve)));
    render(<ContactPage />);
    fillForm();

    await submit();
    expect(callFunction).toHaveBeenCalledWith('sendContactMessage', {
      name: 'Alex Chen',
      email: 'alex@startup.co',
      message: 'Hello there',
    });
    expect(sendButton()).toBeDisabled();
    expect(sendButton()).toHaveTextContent('Sending…');

    await act(async () => resolveCall({ success: true }));
    expect(screen.getByText('Message sent.')).toBeInTheDocument();
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.queryByLabelText('Name')).toBeNull();
  });

  it("shows the server's message for a validation error and keeps what was typed", async () => {
    callFunction.mockRejectedValue(
      new FunctionsError('invalid-argument', 'Please enter a valid email address.'),
    );
    render(<ContactPage />);
    fillForm();

    await submit();
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(name()).toHaveValue('  Alex Chen ');
    expect(message()).toHaveValue(' Hello there ');
    expect(sendButton()).toBeEnabled();
    expect(screen.queryByText('Message sent.')).toBeNull();
  });

  it('shows the generic fallback for any other failure', async () => {
    callFunction.mockRejectedValue(new FunctionsError('internal', 'Failed to send message.'));
    render(<ContactPage />);
    fillForm();

    await submit();
    expect(screen.getByText(FALLBACK)).toBeInTheDocument();
    expect(screen.queryByText('Failed to send message.')).toBeNull();
  });

  it('clears the error and sends again on a retry', async () => {
    callFunction
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ success: true });
    render(<ContactPage />);
    fillForm();

    await submit();
    expect(screen.getByText(FALLBACK)).toBeInTheDocument();

    await submit();
    expect(callFunction).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(FALLBACK)).toBeNull();
    expect(screen.getByText('Message sent.')).toBeInTheDocument();
  });
});
