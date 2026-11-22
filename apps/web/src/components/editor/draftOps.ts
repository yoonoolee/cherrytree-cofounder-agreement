/** Text operations on the draft, with Plate's own transforms, so marks and block ids survive. */
import { getCommentKey } from '@platejs/comment';
import { RangeApi, TextApi, type Point, type SlateEditor, type TRange } from 'platejs';

/** Replaces `range` with `text`; returns the range the new text covers. */
export function replaceRange(editor: SlateEditor, range: TRange, text: string): TRange {
  const startRef = editor.api.pointRef(RangeApi.start(range), { affinity: 'backward' });
  editor.tf.insertText(text, { at: range });
  const start = startRef.unref() ?? RangeApi.start(range);
  const end = editor.api.after(start, { distance: text.length, unit: 'character' }) ?? start;
  return { anchor: start, focus: end };
}

/** The point `offset` characters into top-level block `index`. */
function pointAt(editor: SlateEditor, index: number, offset: number): Point | null {
  let start = 0;
  for (const [leaf, path] of editor.api.nodes({ at: [index], match: TextApi.isText })) {
    const end = start + (leaf.text as string).length;
    if (offset <= end) return { path, offset: offset - start };
    start = end;
  }
  return null;
}

/** Where `text` appears in the draft, if exactly once and within one block. */
export function findText(editor: SlateEditor, text: string): TRange | null {
  if (!text) return null;
  let found: TRange | null = null;
  for (let index = 0; index < editor.children.length; index += 1) {
    const block = editor.api.string([index]);
    const at = block.indexOf(text);
    if (at === -1) continue;
    if (found || block.indexOf(text, at + 1) !== -1) return null;
    const anchor = pointAt(editor, index, at);
    const focus = pointAt(editor, index, at + text.length);
    if (!anchor || !focus) return null;
    found = { anchor, focus };
  }
  return found;
}

/** Anchors comment thread `threadId` to `range`. */
export function addCommentMark(editor: SlateEditor, range: TRange, threadId: string): void {
  editor.tf.setNodes(
    { comment: true, [getCommentKey(threadId)]: true },
    { at: range, match: TextApi.isText, split: true },
  );
}

/** The text thread `threadId` is anchored to, as one range. */
export function commentRange(editor: SlateEditor, threadId: string): TRange | null {
  const key = getCommentKey(threadId);
  const entries = [
    ...editor.api.nodes({ at: [], match: (node) => TextApi.isText(node) && !!node[key] }),
  ];
  const first = entries[0];
  const last = entries.at(-1);
  if (!first || !last) return null;
  return { anchor: editor.api.start(first[1])!, focus: editor.api.end(last[1])! };
}

/** Removes thread `threadId`'s anchor, keeping the text. */
export function removeCommentMark(editor: SlateEditor, threadId: string): void {
  const key = getCommentKey(threadId);
  editor.tf.unsetNodes(key, { at: [], match: (node) => TextApi.isText(node) && !!node[key] });
  // A leaf left with no thread loses its `comment` flag too.
  editor.tf.unsetNodes('comment', {
    at: [],
    match: (node) =>
      TextApi.isText(node) &&
      !!node.comment &&
      !Object.keys(node).some((k) => k.startsWith('comment_')),
  });
}
