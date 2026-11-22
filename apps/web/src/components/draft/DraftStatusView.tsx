import type { DraftStatus } from '@cherrytree/shared';

import StartDraftButton from './StartDraftButton.tsx';
import ProjectLayout from '../ProjectLayout.tsx';
import { DRAFT_STATUS_COPY, DRAFT_STEPS } from '../../constants/draft.ts';
import { formatElapsed, useElapsed } from '../../hooks/useElapsed.ts';

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h1 className="animate-rise font-ui text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl animate-rise text-base text-ink-muted [animation-delay:60ms]">
        {body}
      </p>
    </>
  );
}

/** The job running: an open-ended bar (its length isn't known), the current step, and the time. */
function Progress({ status, startedAt }: { status: DraftStatus; startedAt: Date | null }) {
  const elapsed = useElapsed(startedAt);
  const step = DRAFT_STEPS.find((s) => s.statuses.includes(status)) ?? DRAFT_STEPS[0];
  return (
    <div className="mt-12 max-w-xl animate-rise [animation-delay:120ms]">
      <div
        role="progressbar"
        aria-label={step?.label}
        aria-valuetext={elapsed === null ? undefined : `${formatElapsed(elapsed)} elapsed`}
        className="h-1 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full w-2/5 animate-progress rounded-full bg-accent" />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4 text-sm text-ink-muted">
        <span key={step?.label} className="animate-fade">
          {step?.label}
        </span>
        {elapsed !== null && <span className="tabular-nums">{formatElapsed(elapsed)}</span>}
      </div>
    </div>
  );
}

/** The Drafting + Review job while it runs, and a retry once it has failed. */
function DraftStatusView({
  projectId,
  status,
  startedAt,
}: {
  projectId: string;
  status: Exclude<DraftStatus, 'ready'>;
  startedAt: Date | null;
}) {
  if (status === 'failed') {
    const copy = DRAFT_STATUS_COPY.failed;
    return (
      <ProjectLayout>
        <Heading {...copy} />
        <div className="animate-rise [animation-delay:120ms]">
          <StartDraftButton projectId={projectId} label={copy.action} />
        </div>
      </ProjectLayout>
    );
  }
  return (
    <ProjectLayout>
      <Heading {...DRAFT_STATUS_COPY.working} />
      <Progress status={status} startedAt={startedAt} />
    </ProjectLayout>
  );
}

export default DraftStatusView;
