import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { AdvisorStreamEvent } from '@cherrytree/shared';

import AdvisorView from './AdvisorView.tsx';
import type { AdvisorData } from '../../hooks/useAdvisor.ts';
import { AgentError } from '../../lib/agent.ts';
import {
  REPLY,
  makeAdvisorState,
  makeBtwTurn,
  makeFollowup,
  makeMessage,
  makeTurn,
  withCurrent,
  withFollowups,
} from '../../test/fixtures/advisor.ts';

const mocks = vi.hoisted(() => ({
  advisor: { status: 'loading' } as AdvisorData,
  streamAdvisorTurn: vi.fn(),
  streamAdvisorBtw: vi.fn(),
  startDraft: vi.fn(),
}));

vi.mock('../../hooks/useAdvisor.ts', () => ({ useAdvisor: () => mocks.advisor }));
vi.mock('../../lib/firebase.ts', () => ({ auth: {}, appCheck: null }));
vi.mock('../../lib/agent.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/agent.ts')>()),
  streamAdvisorTurn: mocks.streamAdvisorTurn,
  streamAdvisorBtw: mocks.streamAdvisorBtw,
  startDraft: mocks.startDraft,
}));

/** A stream that yields `events`, pausing before the last one until `release` is called. */
function controlledStream(mock: typeof mocks.streamAdvisorTurn, events: AdvisorStreamEvent[]) {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  async function* stream() {
    for (const [i, event] of events.entries()) {
      if (i === events.length - 1) await gate;
      if (event.type === 'error') throw new AgentError(event.code);
      yield event;
    }
  }
  mock.mockImplementation(stream);
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

/** The first screen after one reply, with a follow-up on "in 2023" being asked. */
function oneReplyIn() {
  const when = makeFollowup('f_when', 'What month in 2023?', 'in 2023', { status: 'current' });
  setData({
    state: withFollowups(makeAdvisorState({ turnCount: 1 }), 'background_meet', [when]),
    turns: [makeTurn(0, { message: makeMessage({ questionId: 'f_when', answer: 'Nice.' }) })],
  });
}

const replyBox = () => screen.getByLabelText<HTMLInputElement | HTMLTextAreaElement>('Your answer');

function sendReply(text: string) {
  fireEvent.change(replyBox(), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
}

const markText = (text: string) =>
  screen.getAllByText((_, el) => el?.tagName === 'MARK' && el.textContent?.endsWith(text) === true);

beforeEach(() => {
  mocks.streamAdvisorTurn.mockReset();
  mocks.streamAdvisorBtw.mockReset();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  setData();
});

describe('AdvisorView', () => {
  it('opens a blank screen on the first question, with the section and the disclaimer', () => {
    render(ui());
    expect(screen.getByRole('heading', { name: 'How did you two meet?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Background' })).toBeInTheDocument();
    expect(screen.getByText(/not a law firm/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('shows progress over every section from the section menu', () => {
    setData({ state: withCurrent(makeAdvisorState(), 'roles_titles') });
    render(ui());
    fireEvent.click(screen.getByRole('button', { name: 'Roles' }));
    expect(screen.getByText('67% complete')).toBeInTheDocument();
    expect(screen.getByText('1 section remaining')).toBeInTheDocument();
  });

  it('streams a reply in place: highlights as written, the answer, then the follow-up', async () => {
    const stream = controlledStream(mocks.streamAdvisorTurn, [
      { type: 'green_highlight', highlight: { text: 'Oakland', start: 28, end: 35 } },
      {
        type: 'red_highlight',
        followupId: 'f_when',
        highlight: { turn: 0, text: 'in 2023', start: 36, end: 43 },
      },
      { type: 'answer_delta', text: 'Nice.' },
      { type: 'done', index: 0, message: makeMessage({ answer: 'Nice.' }) },
    ]);
    const { rerender } = render(ui());
    sendReply(REPLY);

    expect(await screen.findByText('Nice.')).toBeInTheDocument();
    expect(markText('Oakland')[0]).toHaveClass('bg-kept');
    expect(markText('in 2023')[0]).toHaveClass('bg-needs');
    expect(markText('in 2023')[0]).toHaveTextContent('1in 2023');
    expect(screen.queryByLabelText('Your answer')).toBeNull();
    expect(mocks.streamAdvisorTurn).toHaveBeenCalledWith(
      'org_1',
      { reply: REPLY, expectedTurnIndex: 0 },
      expect.any(AbortSignal),
    );

    await stream.release();
    // The saved turn and question list arrive through Firestore.
    oneReplyIn();
    rerender(ui());
    expect(screen.getByRole('heading', { name: 'What month in 2023?' })).toHaveTextContent(
      '1What month in 2023?',
    );
    expect(screen.getAllByText('Nice.')).toHaveLength(1);
    expect(replyBox()).toHaveValue('');
  });

  it('moves an answered follow-up up under the reply, and settles its highlight green', () => {
    const when = makeFollowup('f_when', 'What month in 2023?', 'in 2023', { status: 'done' });
    const who = makeFollowup('f_who', 'Who suggested it?', 'climbing gym', { status: 'current' });
    setData({
      state: withFollowups(makeAdvisorState({ turnCount: 2 }), 'background_meet', [when, who]),
      turns: [
        makeTurn(0, { message: makeMessage({ questionId: 'f_when' }) }),
        makeTurn(1, {
          reply: 'March.',
          greenHighlights: [{ text: 'March', start: 0, end: 5 }],
          message: makeMessage({ questionId: 'f_who' }),
        }),
      ],
    });
    render(ui());

    expect(screen.getByText('What month in 2023?')).toBeInTheDocument();
    expect(markText('in 2023')[0]).toHaveClass('bg-kept');
    expect(markText('in 2023')[0]).toHaveTextContent('2in 2023');
    expect(markText('climbing gym')[0]).toHaveClass('bg-needs');
    expect(markText('March')[0]).toHaveClass('bg-kept');
    expect(screen.getByRole('heading', { name: 'Who suggested it?' })).toHaveTextContent(
      '1Who suggested it?',
    );
  });

  it('holds a move on the screen until Next, then opens the next question blank', () => {
    const move = makeMessage({
      type: 'next_question',
      questionId: 'background_idea',
      answer: 'Co-workers often make strong cofounders.',
    });
    setData({
      state: withCurrent(makeAdvisorState({ turnCount: 1 }), 'background_idea'),
      turns: [makeTurn(0, { message: move })],
    });
    render(ui());

    expect(screen.getByText('Co-workers often make strong cofounders.')).toBeInTheDocument();
    expect(
      screen.getByText("We're good for this part. Click Next to move on."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Your answer')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
    expect(
      screen.getByRole('heading', { name: 'Whose idea was the company?' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Co-workers often make strong cofounders.')).toBeNull();
  });

  it('labels a move into another section Next section', () => {
    const move = makeMessage({ type: 'next_section', questionId: 'roles_titles' });
    setData({
      state: withCurrent(makeAdvisorState({ turnCount: 1 }), 'roles_titles'),
      turns: [makeTurn(0, { message: move })],
    });
    render(ui());
    expect(screen.getByRole('button', { name: 'Next section' })).toBeInTheDocument();
  });

  it('shows sources collapsed under the follow-up, only as http(s) links', () => {
    oneReplyIn();
    const turn = makeTurn(0, {
      message: makeMessage({
        answer: 'Vesting is common.',
        sources: [
          { title: 'Vesting guide', url: 'https://example.com/vesting' },
          { title: 'Bad', url: 'javascript:alert(1)' },
        ],
      }),
    });
    if (mocks.advisor.status === 'ready') mocks.advisor.turns = [turn];
    render(ui());

    expect(screen.getByText('› Sources').closest('details')).not.toHaveAttribute('open');
    const links = within(screen.getByRole('list', { name: 'Sources' })).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://example.com/vesting');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps the reply after a temporary failure and retries it', async () => {
    const failing = controlledStream(mocks.streamAdvisorTurn, [
      { type: 'error', code: 'temporary' },
    ]);
    render(ui());
    sendReply('We met in college.');
    await failing.release();

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(replyBox()).toHaveValue('We met in college.');

    const stream = controlledStream(mocks.streamAdvisorTurn, [
      { type: 'done', index: 0, message: makeMessage() },
    ]);
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
    const refused = controlledStream(mocks.streamAdvisorTurn, [{ type: 'error', code: 'refusal' }]);
    render(ui());
    sendReply('Something odd');
    await refused.release();
    expect(await screen.findByRole('alert')).toHaveTextContent('Try rephrasing your message.');
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(replyBox()).toHaveValue('Something odd');
  });

  it('asks a btw about selected reply text, and drops it on close', async () => {
    oneReplyIn();
    if (mocks.advisor.status === 'ready') {
      mocks.advisor.turns.push(makeBtwTurn(1));
      mocks.advisor.state.turnCount = 2;
    }
    render(ui());
    // Saved btws are history only.
    expect(screen.queryByText('Not for the agreement.')).toBeNull();

    const reply = screen.getByText((_, el) => el?.hasAttribute('data-reply') === true);
    const range = document.createRange();
    range.selectNodeContents(reply);
    range.getBoundingClientRect = () => new DOMRect(0, 0, 10, 10);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    fireEvent.mouseUp(reply);

    const popup = screen.getByRole('dialog', { name: 'Ask about the selected text' });
    const stream = controlledStream(mocks.streamAdvisorBtw, [
      { type: 'answer_delta', text: 'Not ' },
      {
        type: 'btw_done',
        index: 1,
        message: { type: 'answer', text: 'Not really.', sources: [] },
      },
    ]);
    fireEvent.change(within(popup).getByLabelText('Your question'), {
      target: { value: 'Does the gym matter?' },
    });
    fireEvent.click(within(popup).getByRole('button', { name: 'Ask' }));
    await stream.release();

    expect(mocks.streamAdvisorBtw).toHaveBeenCalledWith(
      'org_1',
      { quote: REPLY, question: 'Does the gym matter?', expectedTurnIndex: 2 },
      expect.any(AbortSignal),
    );
    expect(within(popup).getByText('Not really.')).toBeInTheDocument();

    fireEvent.click(within(popup).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ends the interview with the last answer and the start of the draft', async () => {
    mocks.startDraft.mockResolvedValue({ draftStatus: 'queued' });
    const done = makeMessage({ type: 'interview_complete', questionId: null, answer: 'All set.' });
    setData({
      state: withCurrent(makeAdvisorState({ turnCount: 1 }), 'none'),
      turns: [makeTurn(0, { message: done })],
    });
    render(ui());
    expect(screen.getByText('All set.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'That covers everything.' })).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Write my draft' });
    await act(async () => fireEvent.click(button));
    expect(mocks.startDraft).toHaveBeenCalledWith('org_1');
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
