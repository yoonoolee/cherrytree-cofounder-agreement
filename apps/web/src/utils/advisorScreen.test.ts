import {
  advisorProgress,
  advisorView,
  followupText,
  marksFor,
  numberHighlights,
} from './advisorScreen.ts';
import {
  makeAdvisorState,
  makeBtwTurn,
  makeFollowup,
  makeMessage,
  makeTurn,
  withDone,
  withFollowups,
  withScreen,
} from '../test/fixtures/advisor.ts';

describe('advisorView', () => {
  it('shows the last screen with only its replies, not btws', () => {
    const view = advisorView(makeAdvisorState(), [makeTurn(0), makeBtwTurn(1)], null);
    expect(view?.kind).toBe('screen');
    if (view?.kind !== 'screen') return;
    expect(view.screen.id).toBe('screen_1');
    expect(view.screen.turns.map((t) => t.index)).toEqual([0]);
    expect(view.moving).toBeNull();
  });

  it('keeps a moving turn on its screen until Next, also after a reload', () => {
    const state = withScreen(makeAdvisorState(), 'roles', 'Who owns what?');
    const move = makeMessage({
      type: 'next_section',
      question: 'Who owns what?',
      followupId: null,
    });
    const turns = [makeTurn(0, { message: move })];

    const held = advisorView(state, turns, null);
    expect(held).toMatchObject({ kind: 'screen', moving: move });
    if (held?.kind === 'screen') expect(held.screen.id).toBe('screen_1');

    const next = advisorView(state, turns, 0);
    if (next?.kind !== 'screen') throw new Error('expected a screen');
    expect(next.screen).toMatchObject({ id: 'screen_2', question: 'Who owns what?' });
    expect(next.screen.sectionName).toBe('Roles');
    expect(next.screen.turns).toEqual([]);
  });

  it('is complete once the Advisor ends the interview, with the last answer', () => {
    const state = makeAdvisorState({ complete: true });
    const done = makeMessage({ type: 'interview_complete', followupId: null, answer: 'All set.' });
    expect(advisorView(state, [makeTurn(0, { message: done })], null)).toEqual({
      kind: 'complete',
      answer: 'All set.',
    });
  });
});

describe('numberHighlights', () => {
  const when = makeFollowup('f_when', 'When?', 'in 2023', { status: 'done' });
  const where = makeFollowup('f_where', 'Which gym?', 'climbing gym');
  const why = makeFollowup('f_why', 'Why climbing?', 'climbing gym', { status: 'done' });

  it('numbers by first appearance, shares a number per highlight and is open while any is', () => {
    const { highlights, numberOf } = numberHighlights([when, where, why]);
    expect(highlights.map((h) => [h.highlight.text, h.number, h.open])).toEqual([
      ['climbing gym', 1, true],
      ['in 2023', 2, false],
    ]);
    expect([numberOf('f_where'), numberOf('f_why'), numberOf('f_when')]).toEqual([1, 1, 2]);
  });

  it('adds live red highlights as open', () => {
    const live = [{ followupId: 'f_new', highlight: { turn: 0, text: 'We', start: 0, end: 2 } }];
    const { highlights, numberOf } = numberHighlights([when], live);
    expect(highlights.map((h) => [h.highlight.text, h.number, h.open])).toEqual([
      ['We', 1, true],
      ['in 2023', 2, false],
    ]);
    expect(numberOf('f_new')).toBe(1);
  });

  it('gives each reply its own marks', () => {
    const { highlights } = numberHighlights([
      when,
      makeFollowup('f_x', 'X?', 'yes', { turn: 1, reply: 'yes' }),
    ]);
    expect(marksFor(0, [{ start: 0, end: 2 }], highlights)).toEqual([
      { start: 0, end: 2, kind: 'kept' },
      { start: 36, end: 43, kind: 'resolved', number: 1 },
    ]);
    expect(marksFor(1, [], highlights)).toEqual([{ start: 0, end: 3, kind: 'needs', number: 2 }]);
  });
});

describe('followupText and advisorProgress', () => {
  it('finds follow-ups on any screen, and counts settled checklist items', () => {
    const state = withFollowups(withDone(makeAdvisorState(), 'background_1'), 'screen_1', [
      makeFollowup('f_when', 'When?', 'in 2023'),
    ]);
    expect(followupText(state, 'f_when')).toBe('When?');
    expect(followupText(state, 'nope')).toBeNull();

    const progress = advisorProgress(state, 'Background');
    expect(progress.fraction).toBeCloseTo(1 / 3);
    expect(progress.sections).toEqual([
      { name: 'Background', done: false, active: true },
      { name: 'Roles', done: false, active: false },
    ]);
  });
});
