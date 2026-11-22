import Skeleton from './Skeleton.tsx';

/** The page while the draft loads: a sheet with placeholder lines where the text will be. */
function DraftSkeleton() {
  return (
    <div role="status" className="min-h-screen bg-desk px-4 pt-[89px] pb-10 sm:px-9">
      <span className="sr-only">Loading</span>
      <div className="mx-auto max-w-[720px] border border-sheet-edge bg-sheet px-8 pt-14 pb-18 shadow-[0_22px_48px_rgb(45_42_34/12%)] sm:px-16">
        <Skeleton className="mb-8 h-8 w-1/2" />
        {[92, 100, 84, 0, 96, 70].map((width, i) =>
          width ? (
            <Skeleton key={i} className="mb-3 h-3" style={{ width: `${width}%` }} />
          ) : (
            <Skeleton key={i} className="mt-8 mb-4 h-5 w-1/3" />
          ),
        )}
      </div>
    </div>
  );
}

export default DraftSkeleton;
