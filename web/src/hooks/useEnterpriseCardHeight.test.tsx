import { act, render } from '@testing-library/react';

import { useEnterpriseCardHeight } from './useEnterpriseCardHeight.ts';

function Cards({ count = 3 }: { count?: number }) {
  const refs = useEnterpriseCardHeight();
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          data-testid={`card-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
        />
      ))}
    </>
  );
}

describe('useEnterpriseCardHeight', () => {
  const offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get');

  afterAll(() => {
    offsetHeight.mockRestore();
  });

  it('sets the third card to the first card’s height and follows resizes', () => {
    offsetHeight.mockReturnValue(480);
    const { getByTestId } = render(<Cards />);
    expect(getByTestId('card-2').style.height).toBe('480px');
    expect(getByTestId('card-1').style.height).toBe('');

    offsetHeight.mockReturnValue(520);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(getByTestId('card-2').style.height).toBe('520px');
  });

  it('does nothing without a third card', () => {
    offsetHeight.mockReturnValue(480);
    const { getByTestId } = render(<Cards count={2} />);
    expect(getByTestId('card-0').style.height).toBe('');
  });

  it('stops listening after unmount', () => {
    offsetHeight.mockReturnValue(480);
    const { getByTestId, unmount } = render(<Cards />);
    const third = getByTestId('card-2');
    unmount();
    offsetHeight.mockReturnValue(999);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(third.style.height).toBe('480px');
  });
});
