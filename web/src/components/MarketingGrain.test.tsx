import { render } from '@testing-library/react';

import MarketingGrain from './MarketingGrain.tsx';

describe('MarketingGrain', () => {
  it('renders the decorative noise overlay hidden from assistive tech', () => {
    const { container } = render(<MarketingGrain />);
    const svg = container.querySelector('svg.lp-grain');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('filter#lp-grain-f feTurbulence')).not.toBeNull();
    expect(container.querySelector('rect')).toHaveAttribute('filter', 'url(#lp-grain-f)');
  });
});
