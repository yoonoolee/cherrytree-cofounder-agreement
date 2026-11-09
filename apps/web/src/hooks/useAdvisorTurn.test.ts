import { act, renderHook } from '@testing-library/react';
import type { AdvisorStreamEvent } from '@cherrytree/shared';

import { useAdvisorTurn } from './useAdvisorTurn.ts';
import { AgentError } from '../lib/agent.ts';
import { makeMessage } from '../test/fixtures/advisor.ts';

const mocks = vi.hoisted(() => ({ streamAdvisorTurn: vi.fn() }));

vi.mock('../lib/agent.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/agent.ts')>()),
  streamAdvisorTurn: mocks.streamAdvisorTurn,
}));
vi.mock('../lib/firebase.ts', () => ({ auth: {}, appCheck: null }));

/** A stream that never ends until its signal aborts. */
function hangingStream() {
  let signal: AbortSignal | undefined;
  mocks.streamAdvisorTurn.mockImplementation(async function* (_id, _request, s: AbortSignal) {
    signal = s;
    yield { type: 'answer_delta', text: '' };
    await new Promise((_, reject) => {
      const abort = () => reject(new Error('aborted'));
      if (s.aborted) abort();
      else s.addEventListener('abort', abort);
    });
  });
  return () => signal;
}

function stream(events: AdvisorStreamEvent[]) {
  mocks.streamAdvisorTurn.mockImplementation(async function* () {
    for (const event of events) {
      if (event.type === 'error') throw new AgentError(event.code);
      yield event;
    }
  });
}

describe('useAdvisorTurn', () => {
  it('collects highlights and the answer, and drops withdrawn red highlights', async () => {
    const red = (followupId: string, start: number) => ({
      type: 'red_highlight' as const,
      followupId,
      highlight: { turn: 0, text: 'x', start, end: start + 1 },
    });
    stream([
      { type: 'green_highlight', highlight: { text: 'We', start: 0, end: 2 } },
      red('f_a', 3),
      red('f_b', 5),
      { type: 'withdraw_red_highlights', followupIds: ['f_a'] },
      { type: 'answer_delta', text: 'Nice ' },
      { type: 'answer_delta', text: 'to hear.' },
      { type: 'done', index: 0, message: makeMessage() },
    ]);
    const { result } = renderHook(() => useAdvisorTurn('org_1'));

    let sent: boolean | undefined;
    await act(async () => {
      sent = await result.current.send('background_meet', 'We met.', 0);
    });

    expect(sent).toBe(true);
    expect(result.current.live).toMatchObject({
      index: 0,
      screen: 'background_meet',
      reply: 'We met.',
      greenHighlights: [{ text: 'We', start: 0, end: 2 }],
      redHighlights: [{ followupId: 'f_b' }],
      answer: 'Nice to hear.',
      saved: true,
    });
  });

  it('drops the live turn and reports the error when the turn fails', async () => {
    stream([
      { type: 'answer_delta', text: 'Half' },
      { type: 'error', code: 'refusal' },
    ]);
    const { result } = renderHook(() => useAdvisorTurn('org_1'));
    await act(async () => {
      await result.current.send('background_meet', 'Hello', 0);
    });
    expect(result.current.live).toBeNull();
    expect(result.current.error?.code).toBe('refusal');
  });

  it('sends one turn at a time', async () => {
    hangingStream();
    const { result } = renderHook(() => useAdvisorTurn('org_1'));
    let second: Promise<boolean> | undefined;
    act(() => {
      void result.current.send('background_meet', 'First', 0);
      second = result.current.send('background_meet', 'Second', 0);
    });
    await expect(second).resolves.toBe(false);
    expect(mocks.streamAdvisorTurn).toHaveBeenCalledTimes(1);
  });

  it('aborts a running turn on unmount without reporting an error', async () => {
    const signal = hangingStream();
    const { result, unmount } = renderHook(() => useAdvisorTurn('org_1'));
    let sent: Promise<boolean> | undefined;
    act(() => {
      sent = result.current.send('background_meet', 'We met in 2023.', 0);
    });
    await vi.waitFor(() => expect(signal()).toBeDefined());

    unmount();
    expect(signal()?.aborted).toBe(true);
    await expect(sent).resolves.toBe(false);
  });
});
