import { useState } from 'react';

export interface Faq {
  q: string;
  a: string;
}

interface FaqListProps {
  faqs: readonly Faq[];
  /** Adds the scroll-reveal classes (`lp-rv lp-d0`…`lp-d4`) to each item. */
  reveal?: boolean;
}

/** The expandable question list of an `.lp-faq` section: an item opens on hover or click. */
function FaqList({ faqs, reveal = false }: FaqListProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hoveredFaq, setHoveredFaq] = useState<number | null>(null);

  return (
    <div className="lp-faq-list">
      {faqs.map((f, i) => {
        const expanded = openFaq === i || hoveredFaq === i;
        const revealClass = reveal ? ` lp-rv lp-d${Math.min(i, 4)}` : '';
        return (
          <div
            key={i}
            className={`lp-faq-item${revealClass}`}
            onMouseEnter={() => setHoveredFaq(i)}
            onMouseLeave={() => setHoveredFaq((prev) => (prev === i ? null : prev))}
          >
            <button className="lp-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <span className="lp-faq-q">{f.q}</span>
            </button>
            <div className={`lp-faq-body${expanded ? ' open' : ''}`}>
              <div className="lp-faq-body-inner">
                <p className="lp-faq-a">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FaqList;
