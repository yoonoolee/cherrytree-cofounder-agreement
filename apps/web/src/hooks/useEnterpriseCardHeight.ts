import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Refs for the three pricing cards, with the Enterprise card (index 2) forced to the
 * Bootstrapped card's (index 0) height. Enterprise has fewer features, so it naturally renders
 * shorter; matching it to Bootstrapped rather than stretching every card to the tallest one
 * lets Scale (the featured, `transform: scale(1.03)` card) still read as visually larger the
 * way it does in the source design. Re-applied on resize.
 */
export function useEnterpriseCardHeight(): RefObject<(HTMLDivElement | null)[]> {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const matchEnterpriseHeight = () => {
      const bootstrapped = cardRefs.current[0];
      const enterprise = cardRefs.current[2];
      if (!bootstrapped || !enterprise) return;
      enterprise.style.height = 'auto';
      enterprise.style.height = `${bootstrapped.offsetHeight}px`;
    };
    matchEnterpriseHeight();
    window.addEventListener('resize', matchEnterpriseHeight);
    return () => window.removeEventListener('resize', matchEnterpriseHeight);
  }, []);

  return cardRefs;
}
