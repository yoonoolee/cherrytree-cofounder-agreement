import { markSegments, type Mark } from './highlights.ts';

const text = 'We met at a climbing gym in Oakland in 2023.';
const at = (quote: string, kind: Mark['kind'], number?: number): Mark => {
  const start = text.indexOf(quote);
  return { start, end: start + quote.length, kind, ...(number ? { number } : {}) };
};
const shown = (marks: Mark[]) =>
  markSegments(text, marks).map((s) => [s.text, s.mark?.kind ?? null, s.tagged]);

describe('markSegments', () => {
  it('returns the text unmarked without marks', () => {
    expect(shown([])).toEqual([[text, null, false]]);
  });

  it('marks by position, numbering a red mark once at its start', () => {
    expect(shown([at('climbing gym', 'kept'), at('in 2023', 'needs', 1)])).toEqual([
      ['We met at a ', null, false],
      ['climbing gym', 'kept', false],
      [' in Oakland ', null, false],
      ['in 2023', 'needs', true],
      ['.', null, false],
    ]);
  });

  it('lets red win over resolved over green where they overlap', () => {
    expect(
      shown([
        at('gym in Oakland', 'kept'),
        at('in Oakland in', 'resolved', 2),
        at('Oakland', 'needs', 1),
      ]),
    ).toEqual([
      ['We met at a climbing ', null, false],
      ['gym ', 'kept', false],
      ['in ', 'resolved', true],
      ['Oakland', 'needs', true],
      [' in', 'resolved', false],
      [' 2023.', null, false],
    ]);
  });

  it('clips marks outside the text', () => {
    expect(shown([{ start: 40, end: 99, kind: 'kept' }]).at(-1)).toEqual(['023.', 'kept', false]);
  });
});
