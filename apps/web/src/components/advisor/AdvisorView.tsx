import { useState } from 'react';
import type { AdvisorQuestion, AdvisorTurn } from '@cherrytree/shared';

import AdvisorExchange from './AdvisorExchange.tsx';
import AdvisorProgress from './AdvisorProgress.tsx';
import ReplyBox from './ReplyBox.tsx';
import StartDraftButton from '../draft/StartDraftButton.tsx';
import ProjectLayout from '../ProjectLayout.tsx';
import { ADVISOR_COMPLETE, advisorErrorMessage } from '../../constants/advisor.ts';
import { useAdvisor } from '../../hooks/useAdvisor.ts';
import { useAdvisorTurn, type LiveTurn } from '../../hooks/useAdvisorTurn.ts';
import { AgentError } from '../../lib/agent.ts';
import { advisorProgress, currentScreen } from '../../utils/advisorScreen.ts';

/** Confirms the move to the next screen (the next question's, or the end of the interview). */
const nextLabel = (question: AdvisorQuestion | null): string =>
  !question ? 'Continue' : question.type === 'next_section' ? 'Next section' : 'Next question';

const savedExchange = (turn: Pick<AdvisorTurn, 'reply' | 'response'>) => ({
  reply: turn.reply,
  highlights: turn.response.highlights,
  answer: turn.response.answer,
  sources: turn.response.sources,
  followup: turn.response.question?.type === 'followup' ? turn.response.question.text : null,
});

function LiveExchange({ turn }: { turn: LiveTurn }) {
  if (turn.status === 'saved') return <AdvisorExchange {...savedExchange(turn)} />;
  return (
    <AdvisorExchange
      reply={turn.reply}
      highlights={turn.highlights}
      answer={turn.answer || null}
      sources={turn.sources}
      followup={null}
      pending
    />
  );
}

/**
 * The Advisor interview: one screen per main question, with every reply, answer and follow-up on
 * that question stacked under it, ending with the start of the draft. Mount it keyed by project id.
 */
function AdvisorView({ projectId }: { projectId: string }) {
  const advisor = useAdvisor(projectId);
  const { live, error, send, advance } = useAdvisorTurn(projectId);
  const [reply, setReply] = useState('');

  if (advisor.status === 'loading') {
    return (
      <ProjectLayout>
        <p className="text-sm font-light text-ink-muted">Loading your conversation…</p>
      </ProjectLayout>
    );
  }
  if (advisor.status === 'error') {
    return (
      <ProjectLayout>
        <p className="text-base">
          {advisor.error instanceof AgentError
            ? advisorErrorMessage(advisor.error.code, advisor.error.retryAfterSeconds)
            : "We couldn't load your conversation."}
        </p>
        <button
          type="button"
          onClick={advisor.retry}
          className="mt-4 text-sm text-accent underline"
        >
          Try again
        </button>
      </ProjectLayout>
    );
  }

  const { state, turns } = advisor;
  // This tab's turn stays on the screen it was sent from until Firestore has it, or, when held,
  // until the user continues.
  const liveTurn =
    live && (live.status === 'streaming' || live.held || turns.length <= live.index) ? live : null;
  const screen = liveTurn?.screen ?? currentScreen(state, turns);
  const progress = advisorProgress(state);

  if (!screen) {
    return (
      <ProjectLayout>
        <h1 className="font-serif text-4xl sm:text-5xl">{ADVISOR_COMPLETE.title}</h1>
        <p className="mt-4 text-base font-light text-ink-muted">{ADVISOR_COMPLETE.body}</p>
        <StartDraftButton projectId={projectId} label={ADVISOR_COMPLETE.action} />
      </ProjectLayout>
    );
  }

  const submit = async () => {
    if (await send(screen, reply, state.turnCount)) setReply('');
  };
  const continueToNext = () => {
    advance();
    window.scrollTo(0, 0);
  };
  const held = liveTurn?.status === 'saved' && liveTurn.held ? liveTurn : null;

  return (
    <ProjectLayout
      footer={<AdvisorProgress sectionName={screen.sectionName} progress={progress} />}
    >
      <p className="text-xs tracking-[0.2em] text-ink-muted uppercase">
        {String(screen.sectionNumber).padStart(2, '0')} · {screen.sectionName}
      </p>
      <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">{screen.question}</h1>

      {screen.turns.map((turn) => (
        <AdvisorExchange key={turn.index} {...savedExchange(turn)} />
      ))}
      {liveTurn && <LiveExchange turn={liveTurn} />}

      {held ? (
        <div className="mt-10 flex justify-end">
          <button
            type="button"
            onClick={continueToNext}
            className="rounded-full bg-ink px-6 py-2.5 text-sm text-paper"
          >
            {nextLabel(held.response.question)}
          </button>
        </div>
      ) : (
        liveTurn?.status !== 'streaming' && (
          <ReplyBox value={reply} onChange={setReply} onSubmit={() => void submit()} />
        )
      )}

      {error && (
        <div role="alert" className="mt-4 flex items-center gap-4 text-sm text-danger">
          <p>{advisorErrorMessage(error.code, error.retryAfterSeconds)}</p>
          {error.code === 'temporary' && (
            <button type="button" onClick={() => void submit()} className="underline">
              Retry
            </button>
          )}
        </div>
      )}
    </ProjectLayout>
  );
}

export default AdvisorView;
