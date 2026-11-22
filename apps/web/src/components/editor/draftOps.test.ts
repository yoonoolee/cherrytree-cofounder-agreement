import { BaseCommentPlugin, getCommentKey } from '@platejs/comment';
import { createSlateEditor, type SlateEditor } from 'platejs';

import {
  addCommentMark,
  commentRange,
  findText,
  removeCommentMark,
  replaceRange,
} from './draftOps.ts';

function editor(): SlateEditor {
  return createSlateEditor({
    plugins: [BaseCommentPlugin],
    nodeId: true,
    value: [
      { type: 'h1', id: 'b0', children: [{ text: 'Cofounder Agreement' }] },
      {
        type: 'p',
        id: 'b1',
        children: [
          { text: 'Founder Shares shall vest over ' },
          { text: 'four years', bold: true },
          { text: '.' },
        ],
      },
    ],
  });
}

const text = (e: SlateEditor, index: number) => e.api.string([index]);

describe('draftOps', () => {
  it('replaces a range across marks and returns the new text range, for undo', () => {
    const e = editor();
    const range = findText(e, 'shall vest over four')!;
    const applied = replaceRange(e, range, 'will vest over 4');
    expect(text(e, 1)).toBe('Founder Shares will vest over 4 years.');
    expect(e.api.string(applied)).toBe('will vest over 4');

    replaceRange(e, applied, 'shall vest over four');
    expect(text(e, 1)).toBe('Founder Shares shall vest over four years.');
    expect(e.children[1]!.id).toBe('b1');
  });

  it('finds text only when it appears exactly once', () => {
    const e = editor();
    expect(findText(e, 'Shares')).not.toBeNull();
    expect(findText(e, 'o')).toBeNull();
    expect(findText(e, 'missing')).toBeNull();
  });

  it('anchors a thread to text, finds it, and removes the anchor keeping the text', () => {
    const e = editor();
    addCommentMark(e, findText(e, 'four years')!, 'thread_1');
    const anchored = commentRange(e, 'thread_1')!;
    expect(e.api.string(anchored)).toBe('four years');
    expect(JSON.stringify(e.children)).toContain(getCommentKey('thread_1'));

    removeCommentMark(e, 'thread_1');
    expect(commentRange(e, 'thread_1')).toBeNull();
    expect(JSON.stringify(e.children)).not.toContain('comment');
    expect(text(e, 1)).toBe('Founder Shares shall vest over four years.');
  });
});
