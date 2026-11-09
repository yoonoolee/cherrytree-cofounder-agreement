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

const renderView = (status: DraftStatus) =>
  render(
    <MemoryRouter>
      <DraftStatusView projectId="org_1" status={status} />
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
  ] as const)('marks the current step while %s', (status, step) => {
    renderView(status);
    expect(screen.getByRole('heading', { name: 'Writing your draft…' })).toBeInTheDocument();
    expect(screen.getByText(step).closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText(/not a law firm/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('says when the draft is ready', () => {
    renderView('ready');
    expect(screen.getByRole('heading', { name: 'Your draft is ready.' })).toBeInTheDocument();
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
});
