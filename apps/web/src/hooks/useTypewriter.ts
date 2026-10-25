import { useEffect, useState } from 'react';

export interface TypewriterOptions {
  /** ms before the first character (a looping line first clears, then waits one `charDelay`). */
  startDelay?: number;
  /** ms between characters. */
  charDelay?: number;
  /** When set, the finished line is held this long, cleared, and typed out again. */
  holdDelay?: number;
}

/**
 * Types `text` out one character at a time — once, or on a loop when `holdDelay` is given.
 * Every timer is cleared on unmount.
 */
export function useTypewriter(
  text: string,
  { startDelay = 600, charDelay = 60, holdDelay }: TypewriterOptions = {},
): string {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        i++;
        setTyped(text.slice(0, i));
        t(tick, charDelay);
      } else if (holdDelay !== undefined) {
        t(restart, holdDelay);
      }
    };
    const restart = () => {
      setTyped('');
      i = 0;
      t(tick, charDelay);
    };
    t(holdDelay === undefined ? tick : restart, startDelay);
    return () => timers.forEach(clearTimeout);
  }, [text, startDelay, charDelay, holdDelay]);

  return typed;
}
