import {
  BlockquotePlugin,
  BoldPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';
import { CommentPlugin } from '@platejs/comment/react';
import { ListPlugin } from '@platejs/list/react';
import type { Value } from 'platejs';
import { ParagraphPlugin, usePlateEditor, type PlateEditor } from 'platejs/react';

import {
  BlockquoteElement,
  CommentLeaf,
  H1Element,
  H2Element,
  H3Element,
  ParagraphElement,
} from './DraftNodes.tsx';

/** The agreement's elements and marks: the same set Cloud Functions builds drafts with. */
const PLUGINS = [
  ParagraphPlugin.withComponent(ParagraphElement),
  H1Plugin.withComponent(H1Element),
  H2Plugin.withComponent(H2Element),
  H3Plugin.withComponent(H3Element),
  BlockquotePlugin.withComponent(BlockquoteElement),
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  ListPlugin,
  CommentPlugin.withComponent(CommentLeaf),
];

/** A Plate editor on the draft, giving every new block an id. */
export function useDraftPlate(value: Value): PlateEditor {
  return usePlateEditor({ plugins: PLUGINS, value, nodeId: true });
}
