import Skeleton from './Skeleton.tsx';
import ProjectLayout from '../ProjectLayout.tsx';

/**
 * A project screen while it loads: the real header and footer, with placeholders where the
 * question and reply box will be. Every loading step of a project renders it, so the page holds
 * still until the content is in.
 */
function ProjectSkeleton() {
  return (
    <ProjectLayout nav={<Skeleton className="h-5 w-28 rounded-full" />}>
      <div role="status" className="flex min-h-[55vh] flex-1 flex-col justify-center">
        <span className="sr-only">Loading</span>
        <Skeleton className="mb-4 h-10 w-[85%] sm:h-15" />
        <Skeleton className="mb-12 h-10 w-[55%] sm:h-15" />
        <Skeleton className="h-5 w-64 max-w-full" />
        <div className="mt-4 h-px w-full bg-line" />
      </div>
    </ProjectLayout>
  );
}

export default ProjectSkeleton;
