import type { DraftStatus } from '@cherrytree/shared';

import StartDraftButton from './StartDraftButton.tsx';
import ProjectLayout from '../ProjectLayout.tsx';
import { DRAFT_STATUS_COPY, DRAFT_STEPS } from '../../constants/draft.ts';

/** The Drafting + Review job as `draftStatus` reports it, with a retry once it has failed. */
function DraftStatusView({ projectId, status }: { projectId: string; status: DraftStatus }) {
  if (status === 'failed') {
    const copy = DRAFT_STATUS_COPY.failed;
    return (
      <ProjectLayout>
        <h1 className="font-serif text-4xl sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-base font-light text-ink-muted">{copy.body}</p>
        <StartDraftButton projectId={projectId} label={copy.action} />
      </ProjectLayout>
    );
  }
  if (status === 'ready') {
    const copy = DRAFT_STATUS_COPY.ready;
    return (
      <ProjectLayout>
        <h1 className="font-serif text-4xl sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-base font-light text-ink-muted">{copy.body}</p>
      </ProjectLayout>
    );
  }

  const current = DRAFT_STEPS.findIndex((step) => step.statuses.includes(status));
  const copy = DRAFT_STATUS_COPY.working;
  return (
    <ProjectLayout>
      <h1 className="font-serif text-4xl sm:text-5xl">{copy.title}</h1>
      <p className="mt-4 text-base font-light text-ink-muted">{copy.body}</p>
      <ol aria-label="Progress" className="mt-10 flex flex-col gap-4">
        {DRAFT_STEPS.map((step, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'todo';
          return (
            <li
              key={step.label}
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex items-center gap-3 text-base"
            >
              <span
                aria-hidden
                className={
                  state === 'done'
                    ? 'size-2.5 rounded-full bg-accent'
                    : state === 'current'
                      ? 'size-2.5 animate-pulse rounded-full bg-ink'
                      : 'size-2.5 rounded-full border border-line'
                }
              />
              <span className={state === 'todo' ? 'font-light text-ink-muted' : ''}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </ProjectLayout>
  );
}

export default DraftStatusView;
