import { highlightSegments } from '../../utils/highlights.ts';

/** The user's reply with the phrases the Advisor captured highlighted. */
function HighlightedText({ text, phrases }: { text: string; phrases: readonly string[] }) {
  return highlightSegments(text, phrases).map((segment, i) =>
    segment.highlighted ? (
      <mark key={i} className="rounded-md bg-highlight px-1 text-inherit">
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}

export default HighlightedText;
