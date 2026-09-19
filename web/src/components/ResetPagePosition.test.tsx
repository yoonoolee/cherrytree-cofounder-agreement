import { act, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

import ResetPagePosition from './ResetPagePosition.tsx';

function Nav() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/pricing')}>go</button>;
}

describe('ResetPagePosition', () => {
  it('scrolls to the top on mount and again on every route change', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { getByText } = render(
      <MemoryRouter initialEntries={['/']}>
        <ResetPagePosition />
        <Routes>
          <Route path="*" element={<Nav />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);

    act(() => getByText('go').click());
    expect(scrollTo).toHaveBeenCalledTimes(2);
    scrollTo.mockRestore();
  });

  it('renders nothing', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { container } = render(
      <MemoryRouter>
        <ResetPagePosition />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
