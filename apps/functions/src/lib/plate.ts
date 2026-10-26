/**
 * The draft as a Plate document, edited only with Plate's own code (base plugins, no React).
 * Block ids come from Plate's core NodeIdPlugin.
 */
import { BaseBasicBlocksPlugin, BaseBasicMarksPlugin } from '@platejs/basic-nodes';
import { BaseCommentPlugin, getCommentKey } from '@platejs/comment';
import { BaseListPlugin } from '@platejs/list';
import { MarkdownPlugin } from '@platejs/markdown';
import type { DraftBlock, DraftFix, DraftThreadAnchor } from '@cherrytree/shared';
import { createSlateEditor, TextApi, type Point, type SlateEditor, type Value } from 'platejs';

/** Headings, paragraphs, quotes, lists, bold/italic/underline, and comment marks. */
const PLUGINS = [
  BaseBasicBlocksPlugin,
  BaseBasicMarksPlugin,
  BaseListPlugin,
  BaseCommentPlugin,
  MarkdownPlugin,
];

/** A fix or thread anchor that does not fit the draft. */
export class DraftDocumentError extends Error {
  override name = 'DraftDocumentError';
}

function createEditor(value: Value = []): SlateEditor {
  // Explicit: Plate turns block ids off by default when NODE_ENV is `test`.
  return createSlateEditor({ plugins: PLUGINS, value, nodeId: true });
}

function blocks(editor: SlateEditor): DraftBlock[] {
  return editor.children as DraftBlock[];
}

function blockIndex(editor: SlateEditor, id: string): number {
  const index = editor.children.findIndex((block) => block.id === id);
  if (index === -1) throw new DraftDocumentError(`No block with id ${id}`);
  return index;
}

function deserialize(editor: SlateEditor, markdown: string): Value {
  return editor.getApi(MarkdownPlugin).markdown.deserialize(markdown);
}

/** The Drafting Agent's markdown as a Plate value, every top-level block with an id. */
export function markdownToDraft(markdown: string): DraftBlock[] {
  const editor = createEditor();
  editor.tf.setValue(deserialize(editor, markdown));
  if (!editor.api.string([]).trim()) throw new DraftDocumentError('The markdown has no text');
  return blocks(editor);
}

/** The point `offset` characters into block `index`'s text. */
function pointAt(editor: SlateEditor, index: number, offset: number): Point {
  let start = 0;
  let last: Point | null = null;
  for (const [leaf, path] of editor.api.nodes({ at: [index], match: TextApi.isText })) {
    const end = start + (leaf.text as string).length;
    if (offset <= end) return { path, offset: offset - start };
    start = end;
    last = { path, offset: (leaf.text as string).length };
  }
  if (last) return last;
  throw new DraftDocumentError(`Block ${index} has no text`);
}

/** Every `replace` fix of one block, applied from the end so earlier offsets stay valid. */
function applyReplacements(editor: SlateEditor, index: number, fixes: DraftFix[]): void {
  const text = editor.api.string([index]);
  const spans = fixes.map((fix) => {
    if (!fix.old || fix.new === null) {
      throw new DraftDocumentError(`A replace in block ${fix.para} needs old and new text`);
    }
    const start = text.indexOf(fix.old);
    if (start === -1 || text.indexOf(fix.old, start + 1) !== -1) {
      throw new DraftDocumentError(`"${fix.old}" must appear exactly once in block ${fix.para}`);
    }
    return { start, end: start + fix.old.length, text: fix.new };
  });
  spans.sort((a, b) => b.start - a.start);
  spans.forEach((span, i) => {
    if (i > 0 && span.end > spans[i - 1]!.start) {
      throw new DraftDocumentError(`Overlapping replacements in block ${fixes[0]!.para}`);
    }
    editor.tf.insertText(span.text, {
      at: { anchor: pointAt(editor, index, span.start), focus: pointAt(editor, index, span.end) },
    });
  });
}

/**
 * The Review Agent's first-draft fixes, then a comment mark over each thread's block. Fixes are
 * applied block by block from the end of the document, so every fix finds its block where
 * Drafting left it; inserted blocks get new ids.
 */
export function applyReview(
  content: DraftBlock[],
  fixes: DraftFix[],
  threads: DraftThreadAnchor[],
): DraftBlock[] {
  const editor = createEditor(content);
  const targets = [...new Set(fixes.map((fix) => fix.para))]
    .map((para) => ({ para, index: blockIndex(editor, para) }))
    .sort((a, b) => b.index - a.index);

  for (const { para, index } of targets) {
    const own = fixes.filter((fix) => fix.para === para);
    const replacements = own.filter((fix) => fix.op === 'replace');
    if (replacements.length > 0) applyReplacements(editor, index, replacements);

    const inserted = own
      .filter((fix) => fix.op === 'insert_after')
      .flatMap((fix) => {
        if (!fix.new) throw new DraftDocumentError(`An insert after block ${para} needs text`);
        return deserialize(editor, fix.new);
      });
    if (inserted.length > 0) editor.tf.insertNodes(inserted, { at: [index + 1] });

    if (own.some((fix) => fix.op === 'delete')) editor.tf.removeNodes({ at: [index] });
  }

  for (const { threadId, para } of threads) {
    editor.tf.setNodes(
      { comment: true, [getCommentKey(threadId)]: true },
      { at: [blockIndex(editor, para)], match: TextApi.isText },
    );
  }
  return blocks(editor);
}
