import { act, fireEvent, render, screen } from '@testing-library/react';

import WelcomePopup from './WelcomePopup.tsx';

describe('WelcomePopup', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<WelcomePopup isOpen={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('walks through the three steps and closes from the last one', () => {
    const onClose = vi.fn();
    render(<WelcomePopup isOpen onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'Welcome to Cherrytree' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'Collab on the Agreement' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: 'Welcome to Cherrytree' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'Do a Final Review' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wiggles instead of closing when the backdrop is clicked', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { container } = render(<WelcomePopup isOpen onClose={onClose} />);
    const backdrop = container.firstElementChild!;
    const dialog = screen
      .getByRole('heading', { name: 'Welcome to Cherrytree' })
      .closest('.bg-white')!;

    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog).toHaveClass('animate-wiggle');
    act(() => vi.advanceTimersByTime(500));
    expect(dialog).not.toHaveClass('animate-wiggle');
    vi.useRealTimers();
  });
});
