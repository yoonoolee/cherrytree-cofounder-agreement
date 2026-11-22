import { wordDiff } from './wordDiff.ts';

describe('wordDiff', () => {
  it('marks removed and added words, keeping what stayed', () => {
    expect(wordDiff('Founder Shares shall vest', 'Founder Shares will vest')).toEqual([
      { kind: 'same', text: 'Founder Shares ' },
      { kind: 'removed', text: 'shall' },
      { kind: 'added', text: 'will' },
      { kind: 'same', text: ' vest' },
    ]);
  });

  it('handles an empty side', () => {
    expect(wordDiff('', 'new text')).toEqual([{ kind: 'added', text: 'new text' }]);
  });
});
