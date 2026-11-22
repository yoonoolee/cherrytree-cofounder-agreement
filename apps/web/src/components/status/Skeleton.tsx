/** A placeholder block with a slow shimmer, sized by `className` to the content it stands in for. */
function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      style={style}
      className={`block rounded-md bg-[linear-gradient(90deg,var(--color-line)_25%,#ece8e1_50%,var(--color-line)_75%)] bg-size-[200%_100%] animate-shimmer ${className}`}
    />
  );
}

export default Skeleton;
