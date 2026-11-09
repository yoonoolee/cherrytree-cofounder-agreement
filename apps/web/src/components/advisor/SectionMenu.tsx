import { useState } from 'react';

import type { AdvisorProgress } from '../../utils/advisorScreen.ts';

function Dot({ active, done }: { active?: boolean; done?: boolean }) {
  const fill = active ? 'border-ink bg-ink' : done ? 'border-accent bg-accent' : 'border-line';
  return <span className={`size-2.25 shrink-0 rounded-full border-[1.5px] ${fill}`} />;
}

/** The current section; opens the interview's progress over every section. */
function SectionMenu({
  sectionName,
  progress,
}: {
  sectionName: string;
  progress: AdvisorProgress;
}) {
  const [open, setOpen] = useState(false);
  const percent = Math.round(progress.fraction * 100);
  const remaining = progress.sections.filter((section) => !section.done).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2 px-1.5 py-1 text-sm"
      >
        <Dot active />
        {sectionName}
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-3.5 w-48 bg-paper pt-1 pb-2">
          <p className="mb-2.5">{percent}% complete</p>
          <div
            role="progressbar"
            aria-label="Interview progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-0.75 rounded-sm bg-line"
          >
            <div className="h-full rounded-sm bg-ink-muted" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2.5 text-sm text-ink-muted">
            {remaining} {remaining === 1 ? 'section' : 'sections'} remaining
          </p>
          <p className="mt-5 mb-2 text-xs tracking-wide text-ink-muted uppercase">Sections</p>
          <ul className="flex flex-col gap-2.5">
            {progress.sections.map((section) => (
              <li
                key={section.name}
                className={`flex items-center gap-2 font-light ${
                  section.active ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                <Dot active={section.active} done={section.done} />
                {section.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SectionMenu;
