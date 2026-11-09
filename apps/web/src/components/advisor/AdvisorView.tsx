import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

import AskView from './AskView.tsx';
import BottomBox, { type BottomBoxContent } from './BottomBox.tsx';
import BtwPopup from './BtwPopup.tsx';
import ScreenThread, { type SelectedText } from './ScreenThread.tsx';
import SectionMenu from './SectionMenu.tsx';
import StartDraftButton from '../draft/StartDraftButton.tsx';
import ProjectLayout from '../ProjectLayout.tsx';
import { ADVISOR_COMPLETE, advisorErrorMessage } from '../../constants/advisor.ts';
import { useAdvisor } from '../../hooks/useAdvisor.ts';
import { useAdvisorBtw } from '../../hooks/useAdvisorBtw.ts';
import { useAdvisorTurn } from '../../hooks/useAdvisorTurn.ts';
import { AgentError } from '../../lib/agent.ts';
import {
  advisorProgress,
  advisorView,
  numberHighlights,
  questionText,
} from '../../utils/advisorScreen.ts';

/** Runs `update` as a view transition where the browser supports it (the reply slides up). */
function withViewTransition(update: () => void) {
  if (typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

/**
 * The Advisor interview: one screen per main question. A blank screen asks the question; once the
 * user replies, the replies stack on it with the Advisor's highlights, and the bottom box asks the
 * follow-ups, then moves on. Selecting reply text opens the btw popup. Mount it keyed by project.
 */
function AdvisorView({ projectId }: { projectId: string }) {
  const advisor = useAdvisor(projectId);
  const { live, error, send } = useAdvisorTurn(projectId);
  const btws = useAdvisorBtw(projectId);
  const [reply, setReply] = useState('');
  const [movedOn, setMovedOn] = useState<number | null>(null);
  const [selected, setSelected] = useState<SelectedText | null>(null);
  const closeBtw = useCallback(() => {
    btws.close();
    setSelected(null);
  }, [btws]);

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
  const view = advisorView(state, turns, movedOn);
  if (!view || view.kind === 'complete') {
    return (
      <ProjectLayout>
        {view?.answer && <p className="mb-8 text-lg whitespace-pre-line">{view.answer}</p>}
        <h1 className="font-serif text-4xl sm:text-5xl">{ADVISOR_COMPLETE.title}</h1>
        <p className="mt-4 text-base font-light text-ink-muted">{ADVISOR_COMPLETE.body}</p>
        <StartDraftButton projectId={projectId} label={ADVISOR_COMPLETE.action} />
      </ProjectLayout>
    );
  }

  const { screen, moving } = view;
  // This tab's turn shows until Firestore has it.
  const liveTurn =
    live && live.screen === screen.question.id && !turns.some((t) => t.index === live.index)
      ? live
      : null;
  const busy = liveTurn !== null || btws.btw?.status === 'streaming';
  const { highlights, numberOf } = numberHighlights(
    screen.question.followups,
    liveTurn?.redHighlights,
  );

  const submit = () => {
    const sent = send(screen.question.id, reply.trim(), state.turnCount);
    void sent.then((ok) => ok && setReply(''));
  };
  const submitFirstReply = () => withViewTransition(submit);

  const last = screen.turns.at(-1);
  let box: BottomBoxContent | null = null;
  if (liveTurn) {
    box = { kind: 'thinking', answer: liveTurn.answer };
  } else if (moving && last) {
    box = {
      kind: 'moving',
      message: moving,
      onNext: () => {
        setMovedOn(last.index);
        setReply('');
        window.scrollTo(0, 0);
      },
    };
  } else if (last?.message.questionId) {
    box = {
      kind: 'followup',
      message: last.message,
      question: questionText(state, last.message.questionId),
      number: numberOf(last.message.questionId),
      value: reply,
      onChange: setReply,
      onSubmit: submit,
    };
  }

  const errorAlert = error && (
    <div role="alert" className="mt-4 flex items-center gap-4 text-sm text-danger">
      <p>{advisorErrorMessage(error.code, error.retryAfterSeconds)}</p>
      {error.code === 'temporary' && (
        <button type="button" onClick={submit} className="underline">
          Retry
        </button>
      )}
    </div>
  );

  return (
    <ProjectLayout
      nav={
        <SectionMenu
          sectionName={screen.sectionName}
          progress={advisorProgress(state, screen.sectionName)}
        />
      }
      footer={box && <BottomBox content={box}>{errorAlert}</BottomBox>}
    >
      {screen.turns.length === 0 && !liveTurn ? (
        <>
          <AskView
            question={screen.question.text}
            value={reply}
            onChange={setReply}
            onSubmit={submitFirstReply}
          />
          {errorAlert}
        </>
      ) : (
        <ScreenThread
          screen={screen}
          state={state}
          live={
            liveTurn && {
              index: liveTurn.index,
              reply: liveTurn.reply,
              greenHighlights: liveTurn.greenHighlights,
            }
          }
          numbered={highlights}
          numberOf={numberOf}
          onSelect={(selection) => {
            btws.open(selection.quote);
            setSelected(selection);
          }}
        >
          {btws.btw && selected && (
            <BtwPopup
              key={btws.btw.quote}
              btw={btws.btw}
              top={selected.top}
              left={selected.left}
              busy={busy}
              onAsk={(question) => void btws.ask(question, state.turnCount)}
              onClose={closeBtw}
            />
          )}
        </ScreenThread>
      )}
    </ProjectLayout>
  );
}

export default AdvisorView;
