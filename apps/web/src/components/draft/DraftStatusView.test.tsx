import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { DraftStatus } from '@cherrytree/shared';

import DraftStatusView from './DraftStatusView.tsx';
import { AgentError } from '../../lib/agent.ts';

const mocks = vi.hoisted(() => ({ startDraft: vi.fn() }));

vi.mock('../../lib/firebase.ts', () => ({ auth: {}, appCheck: null }));
vi.mock('../../lib/agent.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/agent.ts')>()),
  startDraft: mocks.startDraft,
}));

const renderView = (status: Exclude<DraftStatus, 'ready'>, startedAt: Date | null = null) =>
  render(
    <MemoryRouter>
      <DraftStatusView projectId="org_1" status={status} startedAt={startedAt} />
    </MemoryRouter>,
  );

beforeEach(() => {
  mocks.startDraft.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('DraftStatusView', () => {
  it.each([
    ['queued', 'Writing the agreement from your answers'],
    ['drafting', 'Writing the agreement from your answers'],
    ['reviewing', 'Checking it for consistency and open questions'],
  ] as const)('shows the progress bar with the current step while %s', (status, step) => {
    renderView(status);
    expect(screen.getByRole('heading', { name: 'Writing your draft…' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: step })).toBeInTheDocument();
    expect(screen.getByText(step)).toBeInTheDocument();
    expect(screen.getByText(/not a law firm/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('counts the time since the job started, every second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-16T10:01:24Z'));
    renderView('drafting', new Date('2026-11-16T10:00:00Z'));
    expect(screen.getByText('1:24')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('1:25')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1:25 elapsed');
    vi.useRealTimers();
  });

  it('shows no time when the start is unknown', () => {
    renderView('drafting');
    expect(screen.queryByText(/^\d+:\d\d$/)).toBeNull();
  });

  it('offers a retry after a failure, and reports a retry that fails', async () => {
    mocks.startDraft.mockRejectedValue(new AgentError('temporary'));
    renderView('failed');
    expect(
      screen.getByRole('heading', { name: "We couldn't write your draft." }),
    ).toBeInTheDocument();

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Try again' })));
    expect(mocks.startDraft).toHaveBeenCalledWith('org_1');
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  it('says it is starting while the request runs', async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.startDraft.mockReturnValue(new Promise((r) => (resolve = r)));
    renderView('failed');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    const button = await screen.findByRole('button', { name: 'Starting…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await act(async () => resolve({ draftStatus: 'queued' }));
  });
});
