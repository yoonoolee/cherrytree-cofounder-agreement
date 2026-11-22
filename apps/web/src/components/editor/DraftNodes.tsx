/** How the agreement's elements and comment anchors look in the editor. */
import { getCommentKeys } from '@platejs/comment';
import type { TCommentText } from 'platejs';
import {
  PlateElement,
  PlateLeaf,
  type PlateElementProps,
  type PlateLeafProps,
} from 'platejs/react';

/** A `div`, not a `p`: a list item's paragraph holds the list markup Plate renders around it. */
export function ParagraphElement(props: PlateElementProps) {
  return <PlateElement className="mb-3" {...props} />;
}

export function H1Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h1"
      className="mb-6 font-serif text-[30px] leading-[1.15] tracking-[-0.02em]"
      {...props}
    />
  );
}

export function H2Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h2"
      className="mt-8 mb-3 font-serif text-[20px] leading-[1.25] tracking-[-0.02em]"
      {...props}
    />
  );
}

export function H3Element(props: PlateElementProps) {
  return <PlateElement as="h3" className="mt-6 mb-2 font-medium" {...props} />;
}

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="blockquote"
      className="mb-3 border-l-2 border-line pl-4 text-ink-muted"
      {...props}
    />
  );
}

/** Commented text: tinted, and findable by thread id for the margin cards. */
export function CommentLeaf(props: PlateLeafProps<TCommentText>) {
  const ids = getCommentKeys(props.leaf).map((key) => key.slice('comment_'.length));
  return (
    <PlateLeaf
      {...props}
      as="span"
      className="rounded-[3px] bg-mark px-0.5 box-decoration-clone transition-colors"
      attributes={{ ...props.attributes, 'data-comment-ids': ids.join(' ') }}
    />
  );
}
