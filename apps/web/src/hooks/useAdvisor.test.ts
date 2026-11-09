import { act, renderHook } from '@testing-library/react';

import { useAdvisor } from './useAdvisor.ts';
import { makeAdvisorState, makeTurn } from '../test/fixtures/advisor.ts';

type Listener = { next: (snapshot: unknown) => void; error: (cause: unknown) => void };

const mocks = vi.hoisted(() => ({
  startAdvisorSession: vi.fn(),
  listeners: new Map<string, Listener>(),
  unsubscribe: vi.fn(),
}));

vi.mock('../lib/agent.ts', () => ({ startAdvisorSession: mocks.startAdvisorSession }));
vi.mock('../lib/firebase.ts', () => ({
  advisorStateRef: (id: string) => `projects/${id}/advisor/state`,
  advisorTurnsQuery: (id: string) => `projects/${id}/turns`,
}));
vi.mock('firebase/firestore', () => ({
  onSnapshot: (path: string, next: Listener['next'], error: Listener['error']) => {
    mocks.listeners.set(path, { next, error });
    return mocks.unsubscribe;
  },
}));

const emitState = (data: unknown) =>
  act(() => mocks.listeners.get('projects/org_1/advisor/state')?.next({ data: () => data }));
const emitTurns = (turns: unknown[]) =>
  act(() =>
    mocks.listeners
      .get('projects/org_1/turns')
      ?.next({ docs: turns.map((t) => ({ data: () => t })) }),
  );

beforeEach(() => {
  mocks.listeners.clear();
  mocks.unsubscribe.mockReset();
  mocks.startAdvisorSession.mockReset().mockResolvedValue({ turnCount: 0 });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useAdvisor', () => {
  it('is ready once the session has started and both documents have arrived', async () => {
    const { result } = renderHook(() => useAdvisor('org_1'));
    expect(mocks.startAdvisorSession).toHaveBeenCalledWith('org_1');
    expect(result.current.status).toBe('loading');

    // Before the session creates it, the state reads as missing.
    emitState(undefined);
    emitTurns([]);
    expect(result.current.status).toBe('loading');

    const state = makeAdvisorState();
    const turn = makeTurn(0);
    emitState(state);
    emitTurns([turn]);
    await vi.waitFor(() =>
      expect(result.current).toEqual({ status: 'ready', state, turns: [turn] }),
    );
  });

  it('reports a failed session start and retries it', async () => {
    mocks.startAdvisorSession.mockRejectedValueOnce(new Error('forbidden'));
    const { result } = renderHook(() => useAdvisor('org_1'));
    await vi.waitFor(() => expect(result.current.status).toBe('error'));

    const current = result.current;
    if (current.status !== 'error') throw new Error('expected an error');
    act(current.retry);
    expect(mocks.startAdvisorSession).toHaveBeenCalledTimes(2);
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('loading');
  });

  it('reports a document that fails its schema', async () => {
    const { result } = renderHook(() => useAdvisor('org_1'));
    act(() =>
      mocks.listeners.get('projects/org_1/advisor/state')?.next({
        data: () => {
          throw new Error('invalid');
        },
      }),
    );
    await vi.waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('stops listening on unmount', () => {
    const { unmount } = renderHook(() => useAdvisor('org_1'));
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(2);
  });
});
