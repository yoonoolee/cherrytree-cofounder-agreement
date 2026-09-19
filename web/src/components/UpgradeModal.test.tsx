import { fireEvent, render, screen } from '@testing-library/react';

import UpgradeModal from './UpgradeModal.tsx';

vi.mock('./ProWaitlistForm', () => ({
  default: ({ source }: { source: string }) => <div>waitlist:{source}</div>,
}));

describe('UpgradeModal', () => {
  it('shows Starter and Pro only, with Pro marked coming soon and carrying the waitlist form', () => {
    render(<UpgradeModal onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Starter' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Enterprise' })).toBeNull();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('waitlist:upgrade_modal')).toBeInTheDocument();
  });

  it('badges the current plan (default starter, matched case-insensitively)', () => {
    const { rerender } = render(<UpgradeModal onClose={() => {}} />);
    expect(screen.getByText('Current plan').closest('.relative')).toHaveTextContent('Starter');
    rerender(<UpgradeModal onClose={() => {}} currentPlan="pro" />);
    expect(screen.getByText('Current plan').closest('.relative')).toHaveTextContent('Pro');
  });

  it('closes from the × button and the backdrop, not from inside the dialog', () => {
    const onClose = vi.fn();
    const { container } = render(<UpgradeModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('heading', { name: 'Upgrade Your Plan' }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
