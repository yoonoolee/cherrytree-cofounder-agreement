import { markSegments, type Mark } from '../../utils/highlights.ts';

const MARK_CLASS = {
  kept: 'bg-kept',
  resolved: 'bg-kept',
  needs: 'bg-needs',
} as const;

/**
 * A follow-up's number. Inside a highlight it takes the highlight's color (green once settled);
 * beside the follow-up question it is `large` and keeps the follow-up color.
 */
export function NumberTag({
  number,
  kept = false,
  large = false,
}: {
  number: number;
  kept?: boolean;
  large?: boolean;
}) {
  const size = large
    ? 'mr-2.5 h-7 min-w-7 px-1.75 align-[4px] text-base'
    : 'mr-1.5 h-6 min-w-6 px-1.25 align-[2px] text-sm';
  const color = kept ? 'bg-kept text-kept-ink' : 'bg-needs text-needs-ink';
  return (
    <span
      aria-hidden="true"
      data-number-tag
      className={`inline-flex items-center justify-center rounded-md font-ui leading-none font-semibold select-none ${size} ${color}`}
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
        className={`rounded-[2px] px-1 py-0.5 text-inherit box-decoration-clone ${MARK_CLASS[segment.mark.kind]}`}
      >
        {segment.tagged && segment.mark.number !== undefined && (
          <NumberTag number={segment.mark.number} kept={segment.mark.kind !== 'needs'} />
        )}
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}

export default MarkedText;
