/** A soft status line while an agent works, with three dots that breathe in turn. */
function Working({ status, className = 'text-base' }: { status: string; className?: string }) {
  return (
    <p className={`flex items-baseline gap-1.5 text-ink-muted ${className}`}>
      <span key={status} className="animate-fade">
        {status}
      </span>
      <span aria-hidden className="flex gap-1">
        {[0, 160, 320].map((delay) => (
          <span
            key={delay}
            className="size-1 animate-dot rounded-full bg-ink-muted"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    </p>
  );
}

export default Working;
