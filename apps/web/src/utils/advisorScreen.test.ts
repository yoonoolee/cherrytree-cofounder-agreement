import { advisorProgress, currentScreen } from './advisorScreen.ts';
import {
  followup,
  makeAdvisorState,
  makeResponse,
  makeTurn,
  nextQuestion,
  withCurrent,
} from '../test/fixtures/advisor.ts';

describe('currentScreen', () => {
  it('opens on the first question of the first section', () => {
    expect(currentScreen(makeAdvisorState(), [])).toEqual({
      sectionNumber: 1,
      sectionName: 'Background',
      question: 'How did you two meet?',
      turns: [],
    });
  });

  it('stacks follow-up turns on the screen they were answered on', () => {
    const turns = [
      makeTurn(0),
      makeTurn(1, { response: makeResponse({ question: followup('Q') }) }),
    ];
    expect(currentScreen(makeAdvisorState(), turns)?.turns).toEqual(turns);
  });

  it('starts a new screen at the last turn that moved on, headed by the list wording', () => {
    const opener = makeTurn(1, {
      response: makeResponse({ question: nextQuestion('So whose idea was it?') }),
    });
    const after = makeTurn(2);
    const state = withCurrent(makeAdvisorState(), 'background_idea');
    expect(currentScreen(state, [makeTurn(0), opener, after])).toMatchObject({
      sectionNumber: 1,
      question: 'Whose idea was the company?',
      turns: [after],
    });
  });

  it("takes the section from the current question's section", () => {
    const opener = makeTurn(0, {
      response: makeResponse({ question: { type: 'next_section', text: 'Who does what?' } }),
    });
    const state = withCurrent(makeAdvisorState(), 'roles_titles');
    expect(currentScreen(state, [opener])).toMatchObject({
      sectionNumber: 2,
      sectionName: 'Roles',
      question: 'What will each of you be responsible for?',
    });
  });

  it('is null once no question is current', () => {
    const state = makeAdvisorState();
    const done = {
      ...state,
      sections: state.sections.map((s) => ({
        ...s,
        questions: s.questions.map((q) => ({ ...q, status: 'done' as const })),
      })),
    };
    expect(currentScreen(done, [makeTurn(0, { response: makeResponse({ question: null }) })])).toBe(
      null,
    );
  });
});

describe('advisorProgress', () => {
  it('counts done and skipped questions across every section', () => {
    expect(advisorProgress(makeAdvisorState())).toEqual({ position: 1, total: 3, fraction: 0 });
    expect(advisorProgress(withCurrent(makeAdvisorState(), 'roles_titles'))).toEqual({
      position: 3,
      total: 3,
      fraction: 2 / 3,
    });
  });
});
