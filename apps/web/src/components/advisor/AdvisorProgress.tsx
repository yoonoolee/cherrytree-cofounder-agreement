import type { AdvisorProgress as Progress } from '../../utils/advisorScreen.ts';

/** Section name, a bar over every main question, and the current question's position. */
function AdvisorProgress({ sectionName, progress }: { sectionName: string; progress: Progress }) {
  return (
    <div className="flex items-center gap-4 text-xs tracking-wide text-ink-muted">
      <span>{sectionName}</span>
      <div
        role="progressbar"
        aria-label="Interview progress"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.position - 1}
        className="h-px flex-1 bg-line"
      >
        <div className="h-px bg-ink" style={{ width: `${progress.fraction * 100}%` }} />
      </div>
      <span>
        {progress.position} of {progress.total}
      </span>
    </div>
  );
}

export default AdvisorProgress;
