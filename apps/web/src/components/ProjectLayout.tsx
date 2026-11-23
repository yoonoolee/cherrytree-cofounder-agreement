import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { DISCLAIMER } from '../constants/project.ts';
import BackToDashboard from './BackToDashboard.tsx';
import BrandMark from './BrandMark.tsx';

interface ProjectLayoutProps {
  children: ReactNode;
  /** Shown at the right of the header. */
  nav?: ReactNode;
  /** Pinned at the bottom, above the disclaimer. */
  footer?: ReactNode;
}

/**
 * Every project screen: the way back to the dashboard over the logo, the content, and the bottom panel
 * floating over it with the disclaimer under it.
 */
function ProjectLayout({ children, nav, footer }: ProjectLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-ui text-ink">
      <header className="mx-auto flex w-full max-w-310 items-center justify-between gap-4 px-6 pt-10 sm:px-14 sm:pt-16">
        <div className="flex flex-col items-start gap-3">
          <BackToDashboard />
          <Link
            to="/dashboard"
            aria-label="Cherrytree dashboard"
            className="transition-opacity hover:opacity-75"
          >
            <BrandMark />
          </Link>
        </div>
        {nav}
      </header>
      <main className="mx-auto flex w-full max-w-310 flex-1 flex-col px-6 pt-8 pb-16 sm:px-14">
        {children}
      </main>
      <footer className="pointer-events-none sticky bottom-0 px-4 sm:px-14">
        {footer && <div className="pointer-events-auto mx-auto w-full max-w-282">{footer}</div>}
        <p className="pointer-events-auto mx-auto w-full max-w-282 bg-paper py-2 text-center text-[0.6875rem] text-ink-faint">
          {DISCLAIMER}
        </p>
      </footer>
    </div>
  );
}

export default ProjectLayout;
