import { highlightSegments } from './highlights.ts';

const highlighted = (text: string, phrases: string[]) =>
  highlightSegments(text, phrases)
    .filter((segment) => segment.highlighted)
    .map((segment) => segment.text);

describe('highlightSegments', () => {
  it('splits the text around exact matches and keeps every character', () => {
    const text = 'We split equity 60/40 and vest over four years.';
    const segments = highlightSegments(text, ['60/40', 'four years']);
    expect(segments).toEqual([
      { text: 'We split equity ', highlighted: false },
      { text: '60/40', highlighted: true },
      { text: ' and vest over ', highlighted: false },
      { text: 'four years', highlighted: true },
      { text: '.', highlighted: false },
    ]);
    expect(segments.map((s) => s.text).join('')).toBe(text);
  });

  it('skips phrases that are not in the text and empty phrases', () => {
    expect(highlighted('Maya writes the code.', ['Maya writes code', '', 'Maya'])).toEqual([
      'Maya',
    ]);
  });

  it('highlights every occurrence', () => {
    expect(highlighted('50% now, 50% later', ['50%'])).toEqual(['50%', '50%']);
  });

  it('merges overlapping and touching matches', () => {
    expect(highlighted('full time from June', ['full time', 'time from', ' June'])).toEqual([
      'full time from June',
    ]);
  });

  it('returns the whole text unhighlighted without phrases', () => {
    expect(highlightSegments('Hello', [])).toEqual([{ text: 'Hello', highlighted: false }]);
  });
});
