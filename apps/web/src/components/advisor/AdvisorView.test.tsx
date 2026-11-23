import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  withDone,
  withFollowups,
  withScreen,
} from '../../test/fixtures/advisor.ts';

const mocks = vi.hoisted(() => ({
  advisor: { status: 'loading' } as AdvisorData,
  streamAdvisorTurn: vi.fn(),
  streamAdvisorBtw: vi.fn(),
  startDraft: vi.fn(),
}));

vi.mock('../../hooks/useAdvisor.ts', () => ({ useAdvisor: () => mocks.advisor }));
// Tested on its own (LeavePrompt.test.tsx); here, only whether it's on.
vi.mock('../LeavePrompt.tsx', () => ({
  default: ({ when }: { when: boolean }) => <div data-testid="leave-prompt" data-when={when} />,
}));

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
    state: withFollowups(makeAdvisorState({ turnCount: 1 }), 'screen_1', [when]),
    turns: [makeTurn(0, { message: makeMessage({ followupId: 'f_when', answer: 'Nice.' }) })],
  });
}

const replyBox = () => screen.getByLabelText<HTMLInputElement | HTMLTextAreaElement>('Your answer');

function sendReply(text: string) {
  fireEvent.change(replyBox(), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
}

const markText = (text: string) =>
  screen.getAllByText((_, el) => el?.tagName === 'MARK' && el.textContent?.endsWith(text) === true);

const redMark = (text: string) =>
  screen.queryAllByText((_, el) => el?.tagName === 'MARK' && el.textContent === `1${text}`);

/** The number tag beside a follow-up question, if it has one. */
const numberBeside = (question: string) =>
  screen.getByText(question).parentElement?.previousElementSibling?.textContent ?? null;

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
    expect(screen.getByTestId('leave-prompt')).toHaveAttribute('data-when', 'false');
  });

  it("shows a question's context as its reply box placeholder", () => {
    const state = makeAdvisorState();
    const [first] = state.screens;
    if (!first) throw new Error('expected a screen');
    setData({ state: { ...state, screens: [{ ...first, context: 'Start wherever you like.' }] } });
    render(ui());
    expect(replyBox()).toHaveAttribute('placeholder', 'Start wherever you like.');
  });

  it('shows progress over every section from the section menu', () => {
    setData({
      state: withScreen(
        withDone(makeAdvisorState(), 'background_1', 'background_2'),
        'roles',
        'What will each of you be responsible for?',
      ),
    });
    render(ui());
    fireEvent.click(screen.getByRole('button', { name: 'Roles' }));
    expect(screen.getByText('67% complete')).toBeInTheDocument();
    expect(screen.getByText('1 section remaining')).toBeInTheDocument();
  });

  it('streams a reply in place: highlights one by one, the answer, then the follow-up', async () => {
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

    await waitFor(() => expect(markText('Oakland')[0]).toHaveClass('from-kept', 'animate-sweep'));
    // The second highlight arrived with the first; it sweeps in a moment later, then the answer.
    expect(redMark('in 2023')).toEqual([]);
    expect(screen.queryByText('Nice.')).toBeNull();
    await waitFor(() => expect(markText('in 2023')[0]).toHaveClass('from-needs', 'animate-sweep'));
    expect(markText('in 2023')[0]).toHaveTextContent('1in 2023');
    expect(await screen.findByText('Nice.')).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { name: 'What month in 2023?' })).toBeInTheDocument();
    expect(numberBeside('What month in 2023?')).toBe('1');
    expect(screen.getAllByText('Nice.')).toHaveLength(1);
    expect(replyBox()).toHaveValue('');
  });

  it('keeps highlights first when the turn is saved before they are all in', async () => {
    const stream = controlledStream(mocks.streamAdvisorTurn, [
      { type: 'green_highlight', highlight: { text: 'Oakland', start: 28, end: 35 } },
      {
        type: 'red_highlight',
        followupId: 'f_when',
        highlight: { turn: 0, text: 'in 2023', start: 36, end: 43 },
      },
      { type: 'done', index: 0, message: makeMessage({ answer: 'Nice.' }) },
    ]);
    const { rerender } = render(ui());
    sendReply(REPLY);
    await stream.release();
    // A fast turn: saved while its second highlight still waits to sweep in.
    oneReplyIn();
    rerender(ui());

    expect(redMark('in 2023')).toEqual([]);
    expect(screen.queryByText('What month in 2023?')).toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() => expect(markText('in 2023')[0]).toHaveClass('from-needs', 'animate-sweep'));
    expect(await screen.findByText('What month in 2023?')).toBeInTheDocument();
  });

  it('shows working dots until the answer starts', async () => {
    const stream = controlledStream(mocks.streamAdvisorTurn, [
      { type: 'answer_delta', text: 'Nice.' },
      { type: 'done', index: 0, message: makeMessage({ answer: 'Nice.' }) },
    ]);
    render(ui());
    sendReply(REPLY);

    expect(screen.getByRole('status')).toHaveTextContent('Working on your answer');
    expect(screen.getByTestId('leave-prompt')).toHaveAttribute('data-when', 'true');
    expect(await screen.findByText('Nice.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
    await stream.release();
  });

  it('moves an answered follow-up up under the reply, and settles its highlight green', () => {
    const when = makeFollowup('f_when', 'What month in 2023?', 'in 2023', { status: 'done' });
    const who = makeFollowup('f_who', 'Who suggested it?', 'climbing gym', { status: 'current' });
    setData({
      state: withFollowups(makeAdvisorState({ turnCount: 2 }), 'screen_1', [when, who]),
      turns: [
        makeTurn(0, { message: makeMessage({ followupId: 'f_when' }) }),
        makeTurn(1, {
          reply: 'March.',
          greenHighlights: [{ text: 'March', start: 0, end: 5 }],
          message: makeMessage({ followupId: 'f_who' }),
        }),
      ],
    });
    render(ui());

    expect(screen.getByText('What month in 2023?')).toBeInTheDocument();
    expect(markText('in 2023')[0]).toHaveClass('from-kept');
    expect(markText('in 2023')[0]).toHaveTextContent('2in 2023');
    expect(markText('climbing gym')[0]).toHaveClass('from-needs');
    expect(markText('March')[0]).toHaveClass('from-kept');
    expect(screen.getByRole('heading', { name: 'Who suggested it?' })).toBeInTheDocument();
    expect(numberBeside('Who suggested it?')).toBe('1');
  });

  it('asks a follow-up on something the replies left out without a number', () => {
    const when = makeFollowup('f_when', 'What month in 2023?', 'in 2023', { status: 'done' });
    const office = {
      ...makeFollowup('f_office', 'Where is the office?', null, { status: 'current' }),
      context: 'Notices go to this address.',
    };
    setData({
      state: withFollowups(makeAdvisorState({ turnCount: 2 }), 'screen_1', [when, office]),
      turns: [
        makeTurn(0, { message: makeMessage({ followupId: 'f_when' }) }),
        makeTurn(1, { reply: 'March.', message: makeMessage({ followupId: 'f_office' }) }),
      ],
    });
    render(ui());

    expect(numberBeside('What month in 2023?')).toBe('1');
    expect(screen.getByRole('heading', { name: 'Where is the office?' })).toBeInTheDocument();
    expect(numberBeside('Where is the office?')).toBeNull();
    expect(replyBox()).toHaveAttribute('placeholder', 'Notices go to this address.');
  });

  it('shows a question with bullets as a list under it, and Shift+Enter adds a line', () => {
    const facts = makeFollowup('f_facts', 'A few details:\n- Entity type\n- State', null, {
      status: 'current',
    });
    setData({
      state: withFollowups(makeAdvisorState({ turnCount: 1 }), 'screen_1', [facts]),
      turns: [makeTurn(0, { message: makeMessage({ followupId: 'f_facts' }) })],
    });
    render(ui());

    expect(screen.getByRole('heading', { name: 'A few details:' })).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Entity type', 'State']);

    fireEvent.change(replyBox(), { target: { value: 'C-corp' } });
    fireEvent.keyDown(replyBox(), { key: 'Enter', shiftKey: true });
    expect(mocks.streamAdvisorTurn).not.toHaveBeenCalled();
    fireEvent.keyDown(replyBox(), { key: 'Enter' });
    expect(mocks.streamAdvisorTurn).toHaveBeenCalled();
  });

  it('holds a move on the screen until Next, then opens the next question blank', () => {
    const move = makeMessage({
      type: 'next_question',
      question: 'Whose idea was the company?',
      followupId: null,
      answer: 'Co-workers often make strong cofounders.',
    });
    setData({
      state: withScreen(
        makeAdvisorState({ turnCount: 1 }),
        'background',
        'Whose idea was the company?',
      ),
      turns: [makeTurn(0, { message: move })],
    });
    render(ui());

    expect(screen.getByText('Co-workers often make strong cofounders.')).toBeInTheDocument();
    expect(
      screen.getByText("That's all we need here. Click Next to continue."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Your answer')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByRole('heading', { name: 'Whose idea was the company?' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Co-workers often make strong cofounders.')).toBeNull();
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
    const done = makeMessage({
      type: 'interview_complete',
      followupId: null,
      answer: 'All set.',
    });
    setData({
      state: makeAdvisorState({ turnCount: 1, complete: true }),
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
