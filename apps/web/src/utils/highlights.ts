/**
 * - `kept`: a fact the Advisor noted (green).
 * - `needs`: the part a follow-up still open asks about (red, numbered).
 * - `resolved`: a red highlight whose follow-ups are all done or skipped (green, keeps its number).
 */
type MarkKind = 'kept' | 'needs' | 'resolved';

/** A highlight on one reply, by character positions the server found. */
export interface Mark {
  start: number;
  end: number;
  kind: MarkKind;
  number?: number;
}

export interface TextSegment {
  text: string;
  mark: Mark | null;
  /** The first segment of a numbered mark, where its number shows. */
  tagged: boolean;
}

const PRIORITY: Record<MarkKind, number> = { kept: 1, resolved: 2, needs: 3 };

/**
 * Splits `text` into plain and marked segments. Where marks overlap, a red one wins over a
 * resolved one, which wins over a green one. Marks outside the text are clipped.
 */
export function markSegments(text: string, marks: readonly Mark[]): TextSegment[] {
  const owner: (Mark | null)[] = Array.from({ length: text.length }, () => null);
  for (const mark of marks) {
    for (let i = Math.max(0, mark.start); i < Math.min(text.length, mark.end); i++) {
      const current = owner[i];
      if (!current || PRIORITY[mark.kind] > PRIORITY[current.kind]) owner[i] = mark;
    }
  }

  const segments: TextSegment[] = [];
  const tagged = new Set<Mark>();
  let start = 0;
  for (let i = 1; i <= text.length; i++) {
    if (i < text.length && owner[i] === owner[start]) continue;
    const mark = owner[start] ?? null;
    const first = mark?.number !== undefined && !tagged.has(mark);
    if (first) tagged.add(mark);
    segments.push({ text: text.slice(start, i), mark, tagged: first });
    start = i;
  }
  return segments;
}
