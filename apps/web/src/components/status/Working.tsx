/** Three dots that breathe in turn while an agent works. `label` is for screen readers only. */
function Working({ label, className = '' }: { label: string; className?: string }) {
  return (
    <p role="status" className={`flex h-[1lh] items-center gap-1 ${className}`}>
      <span className="sr-only">{label}</span>
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          aria-hidden
          className="size-1.5 animate-dot rounded-full bg-ink-muted"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </p>
  );
}

export default Working;
