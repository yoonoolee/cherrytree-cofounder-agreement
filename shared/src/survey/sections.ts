/**
 * Survey sections, their order, and metadata.
 * To reorder sections, just change SECTION_ORDER. To add one, add to SECTION_IDS, SECTION_ORDER,
 * and the web `SECTIONS` display config (`web/src/config/sectionConfig.ts`).
 */

// Section identifiers (kebab-case for URL-friendly IDs)
export const SECTION_IDS = {
  FORMATION: 'formation',
  COFOUNDERS: 'cofounders',
  EQUITY_ALLOCATION: 'equity-allocation',
  VESTING: 'vesting',
  DECISION_MAKING: 'decision-making',
  IP: 'ip',
  COMPENSATION: 'compensation',
  PERFORMANCE: 'performance',
  NON_COMPETITION: 'non-competition',
  GENERAL_PROVISIONS: 'general-provisions',
} as const;

export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

export const SECTION_ORDER: readonly SectionId[] = [
  SECTION_IDS.FORMATION,
  SECTION_IDS.COFOUNDERS,
  SECTION_IDS.EQUITY_ALLOCATION,
  SECTION_IDS.VESTING,
  SECTION_IDS.DECISION_MAKING,
  SECTION_IDS.IP,
  SECTION_IDS.COMPENSATION,
  SECTION_IDS.PERFORMANCE,
  SECTION_IDS.NON_COMPETITION,
  SECTION_IDS.GENERAL_PROVISIONS,
];

const getSectionIndex = (sectionId: string): number =>
  (SECTION_ORDER as readonly string[]).indexOf(sectionId);

/** Next section id, or `null` after the last one. An unknown id yields the first section. */
export const getNextSection = (currentSectionId: string): SectionId | null => {
  const currentIndex = getSectionIndex(currentSectionId);
  if (currentIndex < SECTION_ORDER.length - 1) {
    return SECTION_ORDER[currentIndex + 1] ?? null;
  }
  return null;
};

export const isLastSection = (sectionId: string): boolean =>
  getSectionIndex(sectionId) === SECTION_ORDER.length - 1;
