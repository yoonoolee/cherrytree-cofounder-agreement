import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

import AskView from './AskView.tsx';
import BottomBox, { type BottomBoxContent } from './BottomBox.tsx';
import BtwPopup from './BtwPopup.tsx';
import ScreenThread, { type SelectedText } from './ScreenThread.tsx';
import SectionMenu from './SectionMenu.tsx';
import SkipToEnd from './SkipToEnd.tsx';
import UseLatestInterview from './UseLatestInterview.tsx';
import StartDraftButton from '../draft/StartDraftButton.tsx';
import ProjectLayout from '../ProjectLayout.tsx';
import ErrorState from '../status/ErrorState.tsx';
import ProjectSkeleton from '../status/ProjectSkeleton.tsx';
import { ADVISOR_COMPLETE, ADVISOR_COPY, advisorErrorMessage } from '../../constants/advisor.ts';
import { useAdvisor } from '../../hooks/useAdvisor.ts';
import { useAdvisorBtw } from '../../hooks/useAdvisorBtw.ts';
import { useAdvisorTurn } from '../../hooks/useAdvisorTurn.ts';
import { AgentError } from '../../lib/agent.ts';
import { env } from '../../lib/env.ts';
import {
  advisorProgress,
  advisorView,
  followupText,
  numberHighlights,
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
 * The Advisor interview: one screen per question the Advisor asks. A blank screen asks it; once the
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

  if (advisor.status === 'loading') return <ProjectSkeleton />;
  if (advisor.status === 'error') {
    return (
      <ProjectLayout>
        <ErrorState
          title={ADVISOR_COPY.loadError}
          body={
            advisor.error instanceof AgentError
              ? advisorErrorMessage(advisor.error.code, advisor.error.retryAfterSeconds)
              : ADVISOR_COPY.loadErrorBody
          }
          onRetry={advisor.retry}
        />
      </ProjectLayout>
    );
  }

  const { state, turns } = advisor;
  const view = advisorView(state, turns, movedOn);
  if (!view || view.kind === 'complete') {
    return (
      <ProjectLayout>
        {view?.answer && (
          <p className="mb-8 max-w-2xl animate-rise text-lg whitespace-pre-line">{view.answer}</p>
        )}
        <h1 className="animate-rise font-ui text-4xl sm:text-5xl [animation-delay:80ms]">
          {ADVISOR_COMPLETE.title}
        </h1>
        <p className="mt-4 max-w-2xl animate-rise text-base text-ink-muted [animation-delay:140ms]">
          {ADVISOR_COMPLETE.body}
        </p>
        <div className="animate-rise [animation-delay:200ms]">
          <StartDraftButton projectId={projectId} label={ADVISOR_COMPLETE.action} />
        </div>
      </ProjectLayout>
    );
  }

  const { screen, moving } = view;
  // This tab's turn shows until Firestore has it.
  const liveTurn =
    live && live.screen === screen.id && !turns.some((t) => t.index === live.index) ? live : null;
  const busy = liveTurn !== null || btws.btw?.status === 'streaming';
  const { highlights, numberOf } = numberHighlights(screen.followups, liveTurn?.redHighlights);

  const submit = () => {
    const sent = send(screen.id, reply.trim(), state.turnCount);
    void sent.then((ok) => ok && setReply(''));
  };
  const submitFirstReply = () => withViewTransition(submit);

  const last = screen.turns.at(-1);
  let box: BottomBoxContent | null = null;
  if (liveTurn) {
    const highlighting = liveTurn.greenHighlights.length + liveTurn.redHighlights.length > 0;
    box = {
      kind: 'thinking',
      answer: liveTurn.answer,
      status: highlighting ? ADVISOR_COPY.thinking.highlighting : ADVISOR_COPY.thinking.reading,
    };
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
  } else if (last?.message.followupId) {
    box = {
      kind: 'followup',
      message: last.message,
      question: followupText(state, last.message.followupId),
      number: numberOf(last.message.followupId),
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
        <div className="flex items-center gap-4">
          {env.devTools && <UseLatestInterview projectId={projectId} />}
          {env.devTools && <SkipToEnd projectId={projectId} />}
          <SectionMenu
            sectionName={screen.sectionName}
            progress={advisorProgress(state, screen.sectionName)}
          />
        </div>
      }
      footer={box && <BottomBox content={box}>{errorAlert}</BottomBox>}
    >
      {screen.turns.length === 0 && !liveTurn ? (
        <>
          <AskView
            question={screen.question}
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
