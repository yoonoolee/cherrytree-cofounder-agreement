import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { DISCLAIMER } from '../constants/project.ts';

/** Every project screen: a way back to the dashboard, the content, and the disclaimer footer. */
function ProjectLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-ui text-ink">
      <header className="px-6 py-5">
        <Link to="/dashboard" className="text-sm font-light text-accent hover:opacity-80">
          Back to dashboard
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-8 pb-16">{children}</main>
      <footer className="sticky bottom-0 border-t border-line bg-paper px-6 py-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {footer}
          <p className="text-xs font-light text-ink-muted">{DISCLAIMER}</p>
        </div>
      </footer>
    </div>
  );
}

export default ProjectLayout;
