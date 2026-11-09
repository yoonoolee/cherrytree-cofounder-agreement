import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { DISCLAIMER } from '../constants/project.ts';

interface ProjectLayoutProps {
  children: ReactNode;
  /** Shown at the right of the header. */
  nav?: ReactNode;
  /** Pinned at the bottom, above the disclaimer. */
  footer?: ReactNode;
}

/**
 * Every project screen: the logo (back to the dashboard), the content, and the bottom panel
 * floating over it with the disclaimer under it.
 */
function ProjectLayout({ children, nav, footer }: ProjectLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-ui text-ink">
      <header className="mx-auto flex w-full max-w-310 items-center justify-between gap-4 px-6 pt-10 sm:px-14 sm:pt-16">
        <Link
          to="/dashboard"
          aria-label="Cherrytree dashboard"
          className="inline-flex items-center gap-2 hover:opacity-80"
        >
          <img src="/images/cherries.png" alt="" className="h-9 w-auto" />
          <span className="text-xl tracking-[-0.02em]">Cherrytree</span>
        </Link>
        {nav}
      </header>
      <main className="mx-auto flex w-full max-w-310 flex-1 flex-col px-6 pt-8 pb-16 sm:px-14">
        {children}
      </main>
      <footer className="pointer-events-none sticky bottom-0 px-4 sm:px-14">
        {footer && <div className="pointer-events-auto mx-auto w-full max-w-282">{footer}</div>}
        <p className="pointer-events-auto mx-auto w-full max-w-282 bg-paper py-2 text-[11px] font-light text-ink-faint">
          {DISCLAIMER}
        </p>
      </footer>
    </div>
  );
}

export default ProjectLayout;
