import { useEffect, useState } from 'react';

/** Seconds since `start`, ticking every second; null without a start. */
export function useElapsed(start: Date | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!start) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [start]);

  return start ? Math.max(0, Math.floor((now - start.getTime()) / 1000)) : null;
}

/** `m:ss`, e.g. 84 → "1:24". */
export function formatElapsed(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
