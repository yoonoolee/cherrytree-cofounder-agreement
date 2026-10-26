import type { AdvisorState, AdvisorTurn } from '@cherrytree/shared';

/** One main question's screen: the question, then every turn answered on it, stacked. */
export interface AdvisorScreen {
  /** 1-based, in interview order. */
  sectionNumber: number;
  sectionName: string;
  question: string;
  /** Oldest first. Each one's follow-up (if any) is what the next reply answers. */
  turns: AdvisorTurn[];
}

const opensScreen = (turn: AdvisorTurn): boolean =>
  turn.response.question !== null && turn.response.question.type !== 'followup';

/**
 * The screen the interview is on, or `null` once every question is done or skipped. It shows the
 * current main question as the question list words it, with every turn since the last move to a
 * new main question.
 */
export function currentScreen(
  state: AdvisorState,
  turns: readonly AdvisorTurn[],
): AdvisorScreen | null {
  for (const [sectionIndex, section] of state.sections.entries()) {
    const question = section.questions.find((q) => q.status === 'current');
    if (!question) continue;
    return {
      sectionNumber: sectionIndex + 1,
      sectionName: section.name,
      question: question.text,
      turns: turns.slice(turns.findLastIndex(opensScreen) + 1),
    };
  }
  return null;
}

export interface AdvisorProgress {
  /** 1-based position of the current question among all main questions. */
  position: number;
  total: number;
  /** Share of main questions done or skipped, 0–1. */
  fraction: number;
}

/** Progress over the live question list, which grows as the Advisor adds main questions. */
export function advisorProgress(state: AdvisorState): AdvisorProgress {
  const questions = state.sections.flatMap((section) => section.questions);
  const settled = questions.filter((q) => q.status === 'done' || q.status === 'skipped').length;
  const total = questions.length;
  return {
    position: Math.min(settled + 1, total),
    total,
    fraction: total === 0 ? 1 : settled / total,
  };
}
