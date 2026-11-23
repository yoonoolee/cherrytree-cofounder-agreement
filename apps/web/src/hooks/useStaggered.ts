import { useEffect, useRef, useState } from 'react';

/**
 * Lets `keys` through one at a time, in their order and at least `gapMs` apart, so items that
 * arrive together still show one by one. Returns the keys let through so far.
 */
export function useStaggered(keys: readonly string[], gapMs: number): ReadonlySet<string> {
  const [shown, setShown] = useState<ReadonlySet<string>>(() => new Set());
  const lastShownAt = useRef(0);
  const next = keys.find((key) => !shown.has(key));

  useEffect(() => {
    if (next === undefined) return undefined;
    const wait = Math.max(0, lastShownAt.current + gapMs - Date.now());
    const timer = setTimeout(() => {
      lastShownAt.current = Date.now();
      setShown((current) => new Set(current).add(next));
    }, wait);
    return () => clearTimeout(timer);
  }, [next, gapMs]);

  return shown;
}
