import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { AdvisorStreamEvent } from '@cherrytree/shared';

import AdvisorView from './AdvisorView.tsx';
import type { AdvisorData } from '../../hooks/useAdvisor.ts';
import { AgentError } from '../../lib/agent.ts';
import {
  followup,
  makeAdvisorState,
  makeResponse,
  makeTurn,
  nextQuestion,
  withCurrent,
} from '../../test/fixtures/advisor.ts';

const mocks = vi.hoisted(() => ({
  advisor: { status: 'loading' } as AdvisorData,
  streamAdvisorTurn: vi.fn(),
  startDraft: vi.fn(),
}));

vi.mock('../../hooks/useAdvisor.ts', () => ({ useAdvisor: () => mocks.advisor }));
vi.mock('../../lib/firebase.ts', () => ({ auth: {}, appCheck: null }));
vi.mock('../../lib/agent.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/agent.ts')>()),
  streamAdvisorTurn: mocks.streamAdvisorTurn,
  startDraft: mocks.startDraft,
}));

/** A turn stream that yields `events`, pausing before the last one until `release` is called. */
function controlledStream(events: AdvisorStreamEvent[]) {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  async function* stream() {
    for (const [i, event] of events.entries()) {
      if (i === events.length - 1) await gate;
      if (event.type === 'error') throw new AgentError(event.code);
      yield event;
    }
  }
  mocks.streamAdvisorTurn.mockImplementation(stream);
  return {
    release: () =>
      act(async () => {
        release();
        await gate;
      }),
  };
}

const ui = () => (
  <MemoryRouter>
    <AdvisorView projectId="org_1" />
  </MemoryRouter>
);

function setData(data: Partial<Extract<AdvisorData, { status: 'ready' }>> = {}) {
  mocks.advisor = { status: 'ready', state: makeAdvisorState(), turns: [], ...data };
}

const replyBox = () => screen.getByLabelText<HTMLTextAreaElement>('Your answer');

function sendReply(text: string) {
  fireEvent.change(replyBox(), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
}

beforeEach(() => {
  mocks.streamAdvisorTurn.mockReset();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  setData();
});

describe('AdvisorView', () => {
  it('opens on the first question with its section, progress and the disclaimer', () => {
    render(ui());
    expect(screen.getByText('01 · Background')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How did you two meet?' })).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByText(/not a law firm/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('stacks every exchange on the screen with highlights and follow-ups', () => {
    setData({
      state: makeAdvisorState({ turnCount: 2 }),
      turns: [
        makeTurn(0),
        makeTurn(1, {
          reply: 'About three years, we were roommates.',
          response: makeResponse({
            highlights: ['three years'],
            answer: 'That history helps.',
            question: followup('Have you worked together before?'),
          }),
        }),
      ],
    });
    render(ui());
    expect(screen.getByText('at a climbing gym in Oakland').tagName).toBe('MARK');
    expect(screen.getByText('three years').tagName).toBe('MARK');
    expect(screen.getByText('That history helps.')).toBeInTheDocument();
    expect(screen.getByText('How long have you known each other?')).toBeInTheDocument();
    expect(screen.getByText('Have you worked together before?')).toBeInTheDocument();
  });

  it('streams a turn in place, hides the reply box meanwhile, then clears it once saved', async () => {
    const response = makeResponse({ answer: 'Many founders meet that way.' });
    const stream = controlledStream([
      { type: 'highlights', highlights: ['climbing gym'] },
      { type: 'answer_delta', text: 'Many founders' },
      { type: 'done', index: 0, response },
    ]);
    const { rerender } = render(ui());
    sendReply('We met at a climbing gym.');

    expect(await screen.findByText('Many founders')).toBeInTheDocument();
    expect(screen.getByText('climbing gym').tagName).toBe('MARK');
    expect(screen.queryByLabelText('Your answer')).toBeNull();
    expect(mocks.streamAdvisorTurn).toHaveBeenCalledWith(
      'org_1',
      { reply: 'We met at a climbing gym.', expectedTurnIndex: 0 },
      expect.any(AbortSignal),
    );

    await stream.release();
    expect(screen.getByText('Many founders meet that way.')).toBeInTheDocument();
    expect(screen.getByText('How long have you known each other?')).toBeInTheDocument();
    expect(replyBox().value).toBe('');

    // The saved turn arrives through Firestore and replaces the live one.
    setData({
      state: makeAdvisorState({ turnCount: 1 }),
      turns: [makeTurn(0, { reply: 'We met at a climbing gym.', response })],
    });
    rerender(ui());
    expect(screen.getAllByText('Many founders meet that way.')).toHaveLength(1);
  });

  it('holds an answer that moves on until the user continues to the next question', async () => {
    const response = makeResponse({
      answer: 'Co-workers often make strong cofounders.',
      question: nextQuestion('Whose idea was the company?'),
    });
    const stream = controlledStream([{ type: 'done', index: 0, response }]);
    const { rerender } = render(ui());
    sendReply('We worked together at Stripe.');
    await stream.release();

    setData({
      state: withCurrent(makeAdvisorState({ turnCount: 1 }), 'background_idea'),
      turns: [makeTurn(0, { response })],
    });
    rerender(ui());
    expect(screen.getByRole('heading', { name: 'How did you two meet?' })).toBeInTheDocument();
    expect(screen.getByText('Co-workers often make strong cofounders.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Your answer')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
    expect(
      screen.getByRole('heading', { name: 'Whose idea was the company?' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Co-workers often make strong cofounders.')).toBeNull();
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });

  it.each([
    [{ type: 'next_section', text: 'Who does what?' } as const, 'Next section'],
    [null, 'Continue'],
  ])('asks to confirm every move, even without an answer (%o)', async (question, label) => {
    const response = makeResponse({ answer: null, question });
    const stream = controlledStream([{ type: 'done', index: 0, response }]);
    render(ui());
    sendReply('We met in 2023.');
    await stream.release();

    expect(screen.getByRole('heading', { name: 'How did you two meet?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    expect(screen.queryByLabelText('Your answer')).toBeNull();
  });

  it('keeps the reply after a temporary failure and retries it', async () => {
    const failing = controlledStream([{ type: 'error', code: 'temporary' }]);
    render(ui());
    sendReply('We met in college.');
    await failing.release();

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(replyBox().value).toBe('We met in college.');

    const stream = controlledStream([{ type: 'done', index: 0, response: makeResponse() }]);
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Retry' }));
    await stream.release();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(mocks.streamAdvisorTurn).toHaveBeenLastCalledWith(
      'org_1',
      { reply: 'We met in college.', expectedTurnIndex: 0 },
      expect.any(AbortSignal),
    );
  });

  it('asks to rephrase after a refusal, without a retry button', async () => {
    const refused = controlledStream([{ type: 'error', code: 'refusal' }]);
    render(ui());
    sendReply('Something odd');
    await refused.release();
    expect(await screen.findByRole('alert')).toHaveTextContent('Try rephrasing your message.');
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(replyBox().value).toBe('Something odd');
  });

  it('renders only http(s) source links', () => {
    setData({
      turns: [
        makeTurn(0, {
          response: makeResponse({
            answer: 'Vesting is common.',
            sources: [
              { title: 'Vesting guide', url: 'https://example.com/vesting' },
              { title: 'Bad', url: 'javascript:alert(1)' },
            ],
          }),
        }),
      ],
    });
    render(ui());
    const links = within(screen.getByRole('list', { name: 'Sources' })).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://example.com/vesting');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('ends the interview with the start of the draft once no question is current', async () => {
    mocks.startDraft.mockResolvedValue({ draftStatus: 'queued' });
    const state = makeAdvisorState();
    setData({
      state: {
        ...state,
        sections: state.sections.map((s) => ({
          ...s,
          questions: s.questions.map((q) => ({ ...q, status: 'done' as const })),
        })),
      },
    });
    render(ui());
    expect(screen.getByRole('heading', { name: 'That covers everything.' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Your answer')).toBeNull();

    const button = screen.getByRole('button', { name: 'Write my draft' });
    await act(async () => fireEvent.click(button));
    expect(mocks.startDraft).toHaveBeenCalledWith('org_1');
    // The page moves on when draftStatus changes; until then the button stays disabled.
    expect(button).toBeDisabled();
  });

  it('shows a load failure with a retry', () => {
    const retry = vi.fn();
    mocks.advisor = { status: 'error', error: new AgentError('forbidden'), retry };
    render(ui());
    expect(screen.getByText("You don't have access to this project.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});
