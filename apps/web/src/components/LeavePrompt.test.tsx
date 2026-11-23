import { act, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';

import LeavePrompt from './LeavePrompt.tsx';

function renderAt(when: boolean) {
  const router = createMemoryRouter(
    [
      {
        path: '/projects/org_1',
        element: (
          <>
            <LeavePrompt when={when} message="Leave anyway?" />
            <Link to="/dashboard">Dashboard</Link>
          </>
        ),
      },
      { path: '/dashboard', element: <p>Dashboard page</p> },
    ],
    { initialEntries: ['/', '/projects/org_1'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const unload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe('LeavePrompt', () => {
  it('leaves without asking when off', () => {
    const confirm = vi.spyOn(window, 'confirm');
    renderAt(false);
    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
    expect(unload().defaultPrevented).toBe(false);
  });

  it('stays when the user cancels', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderAt(true);
    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(confirm).toHaveBeenCalledWith('Leave anyway?');
    expect(screen.queryByText('Dashboard page')).toBeNull();
  });

  it('leaves when the user confirms', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderAt(true);
    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  it("asks on the browser's Back too", async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const router = renderAt(true);
    await act(() => router.navigate(-1));
    expect(confirm).toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/projects/org_1');
  });

  it("asks before a reload or closing the tab, through the browser's prompt", () => {
    renderAt(true);
    expect(unload().defaultPrevented).toBe(true);
  });
});
