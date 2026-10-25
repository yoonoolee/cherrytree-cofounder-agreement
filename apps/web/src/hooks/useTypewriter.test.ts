import { act, renderHook } from '@testing-library/react';

import { useTypewriter } from './useTypewriter.ts';

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTypewriter', () => {
  it('types once: first character after startDelay, one more per charDelay, then stops', () => {
    const { result, unmount } = renderHook(() => useTypewriter('abc'));
    expect(result.current).toBe('');
    advance(599);
    expect(result.current).toBe('');
    advance(1);
    expect(result.current).toBe('a');
    advance(60);
    expect(result.current).toBe('ab');
    advance(60);
    expect(result.current).toBe('abc');
    advance(60);
    expect(vi.getTimerCount()).toBe(0);
    advance(10_000);
    expect(result.current).toBe('abc');
    unmount();
  });

  it('loops: clears at startDelay, types after one charDelay, holds, clears and types again', () => {
    const { result } = renderHook(() =>
      useTypewriter('ab', { startDelay: 600, charDelay: 46, holdDelay: 2200 }),
    );
    advance(600);
    expect(result.current).toBe('');
    advance(46);
    expect(result.current).toBe('a');
    advance(46);
    expect(result.current).toBe('ab');
    advance(46 + 2200); // the tick after the last character starts the hold
    expect(result.current).toBe('');
    advance(46);
    expect(result.current).toBe('a');
  });

  it('clears its timers on unmount, mid-line', () => {
    const { result, unmount } = renderHook(() => useTypewriter('abc', { holdDelay: 1000 }));
    advance(600 + 60);
    expect(result.current).toBe('a');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
