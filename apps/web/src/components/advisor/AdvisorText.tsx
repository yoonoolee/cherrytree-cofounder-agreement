import type { CSSProperties } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';

const PLUGINS = [remarkBreaks];

const list: Components = {
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-[1.2em]">{children}</ul>,
};
const asHeading = {
  h1: { ...list, p: ({ children }) => <h1>{children}</h1> },
  h2: { ...list, p: ({ children }) => <h2>{children}</h2> },
} satisfies Record<string, Components>;

interface AdvisorTextProps {
  text: string;
  /** A question: its paragraphs are headings at this level, its bullets a list under them. */
  heading?: keyof typeof asHeading;
  className?: string;
  style?: CSSProperties;
}

/** Text the Advisor wrote: paragraphs and bulleted lists (prompts/advisor.md). */
function AdvisorText({ text, heading, className = '', style }: AdvisorTextProps) {
  return (
    <div className={`space-y-2 ${className}`} style={style}>
      <Markdown remarkPlugins={PLUGINS} components={heading ? asHeading[heading] : list}>
        {text}
      </Markdown>
    </div>
  );
}

export default AdvisorText;
