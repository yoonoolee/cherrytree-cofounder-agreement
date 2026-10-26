import { act, renderHook } from '@testing-library/react';

import { useAdvisorTurn } from './useAdvisorTurn.ts';
import { makeAdvisorState } from '../test/fixtures/advisor.ts';
import { currentScreen } from '../utils/advisorScreen.ts';

const mocks = vi.hoisted(() => ({ streamAdvisorTurn: vi.fn() }));

vi.mock('../lib/agent.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/agent.ts')>()),
  streamAdvisorTurn: mocks.streamAdvisorTurn,
}));
vi.mock('../lib/firebase.ts', () => ({ auth: {}, appCheck: null }));

const screen = currentScreen(makeAdvisorState(), []);
if (!screen) throw new Error('fixture has a current question');

/** A stream that never ends until its signal aborts. */
function hangingStream() {
  let signal: AbortSignal | undefined;
  mocks.streamAdvisorTurn.mockImplementation(async function* (_id, _request, s: AbortSignal) {
    signal = s;
    yield { type: 'highlights', highlights: [] };
    await new Promise((_, reject) => {
      const abort = () => reject(new Error('aborted'));
      if (s.aborted) abort();
      else s.addEventListener('abort', abort);
    });
  });
  return () => signal;
}

describe('useAdvisorTurn', () => {
  it('sends one turn at a time', async () => {
    hangingStream();
    const { result } = renderHook(() => useAdvisorTurn('org_1'));
    let second: Promise<boolean> | undefined;
    act(() => {
      void result.current.send(screen, 'First', 0);
      second = result.current.send(screen, 'Second', 0);
    });
    await expect(second).resolves.toBe(false);
    expect(mocks.streamAdvisorTurn).toHaveBeenCalledTimes(1);
  });

  it('aborts a running turn on unmount without reporting an error', async () => {
    const signal = hangingStream();
    const { result, unmount } = renderHook(() => useAdvisorTurn('org_1'));
    let sent: Promise<boolean> | undefined;
    act(() => {
      sent = result.current.send(screen, 'We met in 2023.', 0);
    });
    await vi.waitFor(() => expect(signal()).toBeDefined());

    unmount();
    expect(signal()?.aborted).toBe(true);
    await expect(sent).resolves.toBe(false);
  });
});
