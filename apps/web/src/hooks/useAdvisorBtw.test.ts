import { act, renderHook } from '@testing-library/react';

import { useAdvisorBtw } from './useAdvisorBtw.ts';
import { AgentError } from '../lib/agent.ts';

const mocks = vi.hoisted(() => ({ streamAdvisorBtw: vi.fn() }));

vi.mock('../lib/agent.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/agent.ts')>()),
  streamAdvisorBtw: mocks.streamAdvisorBtw,
}));
vi.mock('../lib/firebase.ts', () => ({ auth: {}, appCheck: null }));

const sources = [{ title: 'Guide', url: 'https://example.com' }];

describe('useAdvisorBtw', () => {
  it('asks about the selected text and keeps the answer until closed', async () => {
    mocks.streamAdvisorBtw.mockImplementation(async function* () {
      yield { type: 'answer_delta', text: 'Not ' };
      yield { type: 'answer_delta', text: 'really.' };
      yield {
        type: 'btw_done',
        index: 4,
        message: { type: 'answer', text: 'Not really.', sources },
      };
    });
    const { result } = renderHook(() => useAdvisorBtw('org_1'));

    act(() => result.current.open('climbing gym'));
    await act(() => result.current.ask('Does it matter?', 4));

    expect(mocks.streamAdvisorBtw).toHaveBeenCalledWith(
      'org_1',
      { quote: 'climbing gym', question: 'Does it matter?', expectedTurnIndex: 4 },
      expect.any(AbortSignal),
    );
    expect(result.current.btw).toMatchObject({
      quote: 'climbing gym',
      question: 'Does it matter?',
      answer: 'Not really.',
      sources,
      status: 'done',
    });

    act(() => result.current.close());
    expect(result.current.btw).toBeNull();
  });

  it('reopens the question on failure, with the error', async () => {
    mocks.streamAdvisorBtw.mockImplementation(async function* () {
      yield { type: 'answer_delta', text: 'Half' };
      throw new AgentError('stale');
    });
    const { result } = renderHook(() => useAdvisorBtw('org_1'));

    act(() => result.current.open('climbing gym'));
    await act(() => result.current.ask('Does it matter?', 4));

    expect(result.current.btw).toMatchObject({ question: null, answer: '', status: 'idle' });
    expect(result.current.btw?.error?.code).toBe('stale');
  });
});
