import { markSegments, type Mark } from '../../utils/highlights.ts';

/** Each highlight's color is a background image, so it can fill in from the left. */
const MARK_CLASS = {
  kept: 'from-kept to-kept',
  resolved: 'from-kept to-kept',
  needs: 'from-needs to-needs',
} as const;

/**
 * A follow-up's number. Inside a highlight it takes the highlight's color (green once settled);
 * beside the follow-up question it is `large` and keeps the follow-up color.
 */
export function NumberTag({
  number,
  kept = false,
  large = false,
  className = '',
}: {
  number: number;
  kept?: boolean;
  large?: boolean;
  className?: string;
}) {
  const size = large
    ? 'mr-2.5 h-7 min-w-7 px-1.75 align-[4px] text-base'
    : 'mr-1.5 h-6 min-w-6 px-1.25 align-[2px] text-sm';
  const color = kept ? 'bg-kept text-kept-ink' : 'bg-needs text-needs-ink';
  return (
    <span
      aria-hidden="true"
      data-number-tag
      className={`inline-flex items-center justify-center rounded-md font-ui leading-none select-none ${size} ${color} ${className}`}
    >
      {number}
    </span>
  );
}

/** A reply with the Advisor's highlights: green for facts, numbered red for open follow-ups. */
function MarkedText({ text, marks }: { text: string; marks: readonly Mark[] }) {
  return markSegments(text, marks).map((segment, i) =>
    segment.mark ? (
      <mark
        key={i}
        className={`rounded-[2px] bg-linear-to-r bg-left bg-no-repeat px-1 py-0.5 text-inherit box-decoration-clone ${MARK_CLASS[segment.mark.kind]} ${segment.mark.sweep ? 'animate-sweep' : ''}`}
      >
        {segment.tagged && segment.mark.number !== undefined && (
          <NumberTag
            number={segment.mark.number}
            kept={segment.mark.kind !== 'needs'}
            className={segment.mark.sweep ? 'animate-fade' : ''}
          />
        )}
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}

export default MarkedText;
