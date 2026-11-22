import { act, renderHook } from '@testing-library/react';
import type { DraftBlock } from '@cherrytree/shared';

import { useDraftSave } from './useDraftSave.ts';
import { AgentError } from '../lib/agent.ts';

const mocks = vi.hoisted(() => ({ saveDraft: vi.fn() }));

vi.mock('../lib/agent.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/agent.ts')>()),
  saveDraft: mocks.saveDraft,
}));
vi.mock('../lib/firebase.ts', () => ({ auth: {}, appCheck: null }));

const doc = (text: string): DraftBlock[] => [{ type: 'p', id: 'b1', children: [{ text }] }];

describe('useDraftSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.saveDraft.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('saves a change made during a save right after it, on the new version', async () => {
    let finishFirst!: (version: number) => void;
    mocks.saveDraft
      .mockImplementationOnce(() => new Promise((resolve) => (finishFirst = resolve)))
      .mockResolvedValueOnce(3);
    const { result } = renderHook(() => useDraftSave('p1', 1));

    act(() => result.current.schedule(doc('one')));
    await act(() => vi.runAllTimersAsync());
    act(() => result.current.schedule(doc('two')));
    await act(() => vi.runAllTimersAsync());
    await act(async () => finishFirst(2));

    expect(mocks.saveDraft).toHaveBeenNthCalledWith(2, 'p1', { content: doc('two'), version: 2 });
    expect(result.current.status).toBe('saved');
  });

  it('stops saving once the draft changed elsewhere', async () => {
    mocks.saveDraft.mockRejectedValue(new AgentError('stale'));
    const { result } = renderHook(() => useDraftSave('p1', 1));

    act(() => result.current.schedule(doc('one')));
    await act(() => vi.runAllTimersAsync());
    act(() => result.current.schedule(doc('two')));
    await act(() => vi.runAllTimersAsync());

    expect(mocks.saveDraft).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('stale');
  });

  it('keeps a failed change for a retry', async () => {
    mocks.saveDraft.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(2);
    const { result } = renderHook(() => useDraftSave('p1', 1));

    act(() => result.current.schedule(doc('one')));
    await act(() => vi.runAllTimersAsync());
    expect(result.current.status).toBe('failed');

    await act(() => result.current.retry());
    expect(mocks.saveDraft).toHaveBeenLastCalledWith('p1', { content: doc('one'), version: 1 });
    expect(result.current.status).toBe('saved');
  });
});
