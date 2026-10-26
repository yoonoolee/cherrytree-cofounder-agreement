import type { WebSource } from '@cherrytree/shared';

import HighlightedText from './HighlightedText.tsx';
import SourceLinks from './SourceLinks.tsx';

interface AdvisorExchangeProps {
  reply: string;
  /** `null` while the Advisor has not returned them yet. */
  highlights: readonly string[] | null;
  answer: string | null;
  sources: readonly WebSource[];
  /** A follow-up on the same main question. */
  followup: string | null;
  /** The Advisor is still writing this exchange. */
  pending?: boolean;
}

/** One reply and the Advisor's response, rendered on the main question's screen. */
function AdvisorExchange({
  reply,
  highlights,
  answer,
  sources,
  followup,
  pending = false,
}: AdvisorExchangeProps) {
  return (
    <section className="mt-10" aria-busy={pending}>
      <p className="font-serif text-2xl leading-relaxed whitespace-pre-line sm:text-3xl">
        {highlights ? <HighlightedText text={reply} phrases={highlights} /> : reply}
      </p>
      <div aria-live="polite">
        {answer && (
          <p className="mt-6 text-base leading-relaxed font-light whitespace-pre-line text-ink-muted">
            {answer}
          </p>
        )}
        <SourceLinks sources={sources} />
        {pending && !answer && <p className="mt-6 text-sm font-light text-ink-muted">Thinking…</p>}
        {followup && (
          <p className="mt-8 text-xl leading-snug">
            <span className="mb-1 block text-xs tracking-[0.18em] text-accent uppercase">
              Cherrytree asks
            </span>
            {followup}
          </p>
        )}
      </div>
    </section>
  );
}

export default AdvisorExchange;
