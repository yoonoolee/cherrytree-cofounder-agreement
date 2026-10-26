import type { DraftBlock, DraftFix } from '@cherrytree/shared';

import { applyReview, DraftDocumentError, markdownToDraft } from './plate.ts';

const MARKDOWN = `# Cofounder Agreement

This agreement is between **Avery Lee** and Sam Kim.

## Equity

- Avery: 50%
- Sam: 50%

## Vesting

Shares vest over four years with a one-year cliff.
`;

const textOf = (block: DraftBlock): string =>
  block.children.map((child) => ('text' in child ? child.text : '')).join('');

function draft() {
  const content = markdownToDraft(MARKDOWN);
  const byText = (text: string) => content.find((block) => textOf(block) === text)!;
  return { content, byText };
}

const fix = (op: DraftFix['op'], para: string, old: string | null, text: string | null) => ({
  op,
  para,
  old,
  new: text,
});

describe('markdownToDraft', () => {
  it('converts markdown to top-level blocks, each with a unique id', () => {
    const { content } = draft();
    expect(content.map((block) => [block.type, textOf(block)])).toEqual([
      ['h1', 'Cofounder Agreement'],
      ['p', 'This agreement is between Avery Lee and Sam Kim.'],
      ['h2', 'Equity'],
      ['p', 'Avery: 50%'],
      ['p', 'Sam: 50%'],
      ['h2', 'Vesting'],
      ['p', 'Shares vest over four years with a one-year cliff.'],
    ]);
    const ids = content.map((block) => block.id);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps marks and list formatting', () => {
    const { content } = draft();
    expect(content[1]!.children).toContainEqual({ text: 'Avery Lee', bold: true });
    expect(content[3]).toMatchObject({ listStyleType: 'disc', indent: 1 });
  });

  it('rejects markdown without content', () => {
    expect(() => markdownToDraft('   \n')).toThrow(DraftDocumentError);
  });
});

describe('applyReview', () => {
  it('replaces text, keeping the block id and the marks around it', () => {
    const { content, byText } = draft();
    const intro = byText('This agreement is between Avery Lee and Sam Kim.');
    const result = applyReview(
      content,
      [
        fix('replace', intro.id, 'This agreement', 'This Cofounder Agreement'),
        fix('replace', intro.id, 'Sam Kim', 'Sam Kim (each a "Founder")'),
      ],
      [],
    );
    const block = result.find((b) => b.id === intro.id)!;
    expect(textOf(block)).toBe(
      'This Cofounder Agreement is between Avery Lee and Sam Kim (each a "Founder").',
    );
    expect(block.children).toContainEqual({ text: 'Avery Lee', bold: true });
  });

  it('replaces text that spans marks', () => {
    const { content, byText } = draft();
    const intro = byText('This agreement is between Avery Lee and Sam Kim.');
    const result = applyReview(
      content,
      [fix('replace', intro.id, 'Lee and Sam', 'Lee and Samuel')],
      [],
    );
    expect(textOf(result.find((b) => b.id === intro.id)!)).toBe(
      'This agreement is between Avery Lee and Samuel Kim.',
    );
  });

  it('inserts markdown blocks after a block, with new ids, and deletes blocks', () => {
    const { content, byText } = draft();
    const vesting = byText('Shares vest over four years with a one-year cliff.');
    const sam = byText('Sam: 50%');
    const result = applyReview(
      content,
      [
        fix(
          'insert_after',
          vesting.id,
          null,
          '## Departure\n\nA departing founder keeps vested shares.',
        ),
        fix('delete', sam.id, null, null),
      ],
      [],
    );
    expect(result.map(textOf)).toEqual([
      'Cofounder Agreement',
      'This agreement is between Avery Lee and Sam Kim.',
      'Equity',
      'Avery: 50%',
      'Vesting',
      'Shares vest over four years with a one-year cliff.',
      'Departure',
      'A departing founder keeps vested shares.',
    ]);
    const ids = result.map((block) => block.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(0, 6)).toEqual(content.filter((b) => b.id !== sam.id).map((b) => b.id));
  });

  it("marks each thread's block with its comment", () => {
    const { content, byText } = draft();
    const intro = byText('This agreement is between Avery Lee and Sam Kim.');
    const result = applyReview(content, [], [{ threadId: 'thread1', para: intro.id }]);
    const block = result.find((b) => b.id === intro.id)!;
    expect(block.children.length).toBeGreaterThan(0);
    for (const leaf of block.children) {
      expect(leaf).toMatchObject({ comment: true, comment_thread1: true });
    }
    expect(result.filter((b) => b.id !== intro.id).flatMap((b) => b.children)).not.toContainEqual(
      expect.objectContaining({ comment: true }),
    );
  });

  it.each([
    ['an unknown block', fix('replace', 'missing', 'a', 'b')],
    ['text that is not in the block', fix('replace', 'INTRO', 'nowhere', 'b')],
    ['text that appears twice', fix('replace', 'INTRO', 'a', 'b')],
    ['an insert without text', fix('insert_after', 'INTRO', null, null)],
  ])('rejects a fix on %s', (_, bad) => {
    const { content, byText } = draft();
    const intro = byText('This agreement is between Avery Lee and Sam Kim.');
    const target = { ...bad, para: bad.para === 'INTRO' ? intro.id : bad.para };
    expect(() => applyReview(content, [target], [])).toThrow(DraftDocumentError);
  });

  it('rejects overlapping replacements and threads on unknown blocks', () => {
    const { content, byText } = draft();
    const intro = byText('This agreement is between Avery Lee and Sam Kim.');
    expect(() =>
      applyReview(
        content,
        [fix('replace', intro.id, 'Avery Lee', 'A'), fix('replace', intro.id, 'Lee and', 'B')],
        [],
      ),
    ).toThrow(DraftDocumentError);
    expect(() => applyReview(content, [], [{ threadId: 't', para: 'missing' }])).toThrow(
      DraftDocumentError,
    );
  });
});
