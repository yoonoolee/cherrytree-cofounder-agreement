export interface TextSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Splits `text` into plain and highlighted segments. The Advisor quotes the user's phrases
 * exactly, so every exact occurrence of a phrase is highlighted; a phrase that does not occur
 * (a misquote) is skipped. Overlapping or touching matches merge into one segment.
 */
export function highlightSegments(text: string, phrases: readonly string[]): TextSegment[] {
  const ranges: [number, number][] = [];
  for (const phrase of phrases) {
    if (!phrase) continue;
    for (let start = text.indexOf(phrase); start !== -1; start = text.indexOf(phrase, start + 1)) {
      ranges.push([start, start + phrase.length]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  const segments: TextSegment[] = [];
  let position = 0;
  for (const [start, end] of merged) {
    if (start > position) segments.push({ text: text.slice(position, start), highlighted: false });
    segments.push({ text: text.slice(start, end), highlighted: true });
    position = end;
  }
  if (position < text.length) segments.push({ text: text.slice(position), highlighted: false });
  return segments;
}
