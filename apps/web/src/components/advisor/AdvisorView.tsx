import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

import AdvisorText from './AdvisorText.tsx';
import AskView from './AskView.tsx';
import BottomBox, { type BottomBoxContent } from './BottomBox.tsx';
import BtwPopup from './BtwPopup.tsx';
import ScreenThread, { type SelectedText } from './ScreenThread.tsx';
import SectionMenu from './SectionMenu.tsx';
import SkipToEnd from './SkipToEnd.tsx';
import UseLatestInterview from './UseLatestInterview.tsx';
import StartDraftButton from '../draft/StartDraftButton.tsx';
import LeavePrompt from '../LeavePrompt.tsx';
import ProjectLayout from '../ProjectLayout.tsx';
import ErrorState from '../status/ErrorState.tsx';
import ProjectSkeleton from '../status/ProjectSkeleton.tsx';
import { ADVISOR_COMPLETE, ADVISOR_COPY, advisorErrorMessage } from '../../constants/advisor.ts';
import { useAdvisor } from '../../hooks/useAdvisor.ts';
import { useAdvisorBtw } from '../../hooks/useAdvisorBtw.ts';
import { useAdvisorTurn } from '../../hooks/useAdvisorTurn.ts';
import { useStaggered } from '../../hooks/useStaggered.ts';
import { AgentError } from '../../lib/agent.ts';
import { env } from '../../lib/env.ts';
import {
  advisorProgress,
  advisorView,
  findFollowup,
  numberHighlights,
} from '../../utils/advisorScreen.ts';

/** How far apart a reply's highlights start sweeping in (each sweep: `--animate-sweep`). */
const HIGHLIGHT_GAP_MS = 450;

const greenKey = (turn: number, { start, end }: { start: number; end: number }) =>
  `green:${turn}:${start}:${end}`;
const redKey = (turn: number, { followupId }: { followupId: string }) =>
  `red:${turn}:${followupId}`;

/**
 * Runs `update` as a view transition where the browser supports it: by default the first reply
 * slides up into the thread; `next-screen` (index.css) slides the screen out to the left.
 */
function withViewTransition(update: () => void, type?: 'next-screen') {
  if (typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  document.startViewTransition({ update: () => flushSync(update), types: type ? [type] : [] });
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
  // A turn's highlights often stream in together; they show one by one.
  const shownHighlights = useStaggered(
    live
      ? [
          ...live.greenHighlights.map((h) => greenKey(live.index, h)),
          ...live.redHighlights.map((r) => redKey(live.index, r)),
        ]
      : [],
    HIGHLIGHT_GAP_MS,
  );
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
          <AdvisorText text={view.answer} className="mb-8 max-w-2xl animate-rise text-lg" />
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
  // This tab's latest turn on this screen, saved or not: its highlights sweep in one by one.
  const sweeping = live?.screen === screen.id ? live : null;
  const sweepingGreen =
    sweeping?.greenHighlights.filter((h) => shownHighlights.has(greenKey(sweeping.index, h))) ?? [];
  const sweepingRed =
    sweeping?.redHighlights.filter((r) => shownHighlights.has(redKey(sweeping.index, r))) ?? [];
  const waitingRed = new Set(
    sweeping?.redHighlights
      .filter((r) => !shownHighlights.has(redKey(sweeping.index, r)))
      .map((r) => r.followupId),
  );
  // Highlights come first: the response shows once every highlight has started sweeping in.
  const highlightsIn =
    !sweeping ||
    (sweepingGreen.length === sweeping.greenHighlights.length && waitingRed.size === 0);
  const { highlights, numberOf } = numberHighlights(
    screen.followups.filter((f) => !waitingRed.has(f.id)),
    sweepingRed,
  );

  const submit = () => {
    const sent = send(screen.id, reply.trim(), state.turnCount);
    void sent.then((ok) => ok && setReply(''));
  };
  const submitFirstReply = () => withViewTransition(submit);

  const last = screen.turns.at(-1);
  let box: BottomBoxContent | null = null;
  if (liveTurn || !highlightsIn) {
    box = { kind: 'thinking', answer: highlightsIn ? (liveTurn?.answer ?? '') : '' };
  } else if (moving && last) {
    box = {
      kind: 'moving',
      message: moving,
      onNext: () =>
        withViewTransition(() => {
          setMovedOn(last.index);
          setReply('');
          window.scrollTo(0, 0);
        }, 'next-screen'),
    };
  } else if (last?.message.followupId) {
    const followup = findFollowup(state, last.message.followupId);
    box = {
      kind: 'followup',
      message: last.message,
      question: followup?.text ?? null,
      context: followup?.context ?? null,
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
      <LeavePrompt when={busy} message={ADVISOR_COPY.leaveWhileAnswering} />
      {screen.turns.length === 0 && !liveTurn ? (
        <>
          <AskView
            question={screen.question}
            context={screen.context ?? null}
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
          live={liveTurn && { index: liveTurn.index, reply: liveTurn.reply }}
          sweeping={sweeping && { index: sweeping.index, greenHighlights: sweepingGreen }}
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
