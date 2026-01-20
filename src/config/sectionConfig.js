/**
 * Section Configuration
 *
 * Defines all survey sections, their order, and metadata.
 * To reorder sections, just change SECTION_ORDER array.
 * To add a new section, add to SECTION_IDS, SECTION_ORDER, and SECTIONS.
 */

// Section identifiers (use kebab-case for URL-friendly IDs)
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
};

// Define section order (easy to reorder/add/remove)
export const SECTION_ORDER = [
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

// Section metadata
export const SECTIONS = {
  [SECTION_IDS.FORMATION]: {
    displayName: 'Formation & Purpose',
    icon: '🏢',
  },
  [SECTION_IDS.COFOUNDERS]: {
    displayName: 'Cofounder Info',
    icon: '👥',
  },
  [SECTION_IDS.EQUITY_ALLOCATION]: {
    displayName: 'Equity Allocation',
    icon: '📊',
  },
  [SECTION_IDS.VESTING]: {
    displayName: 'Vesting Schedule',
    icon: '📅',
  },
  [SECTION_IDS.DECISION_MAKING]: {
    displayName: 'Decision-Making',
    icon: '⚖️',
  },
  [SECTION_IDS.IP]: {
    displayName: 'IP & Ownership',
    icon: '💡',
  },
  [SECTION_IDS.COMPENSATION]: {
    displayName: 'Compensation',
    icon: '💰',
  },
  [SECTION_IDS.PERFORMANCE]: {
    displayName: 'Performance',
    icon: '📈',
  },
  [SECTION_IDS.NON_COMPETITION]: {
    displayName: 'Non-Competition',
    icon: '🔒',
  },
  [SECTION_IDS.GENERAL_PROVISIONS]: {
    displayName: 'General Provisions',
    icon: '📋',
  },
};

/**
 * Get section index from section ID
 */
export const getSectionIndex = (sectionId) => SECTION_ORDER.indexOf(sectionId);

/**
 * Get section ID from index (legacy compatibility)
 */
export const getSectionIdByIndex = (index) => SECTION_ORDER[index];

/**
 * Get next section ID
 */
export const getNextSection = (currentSectionId) => {
  const currentIndex = getSectionIndex(currentSectionId);
  if (currentIndex < SECTION_ORDER.length - 1) {
    return SECTION_ORDER[currentIndex + 1];
  }
  return null;
};

/**
 * Get previous section ID
 */
export const getPreviousSection = (currentSectionId) => {
  const currentIndex = getSectionIndex(currentSectionId);
  if (currentIndex > 0) {
    return SECTION_ORDER[currentIndex - 1];
  }
  return null;
};

/**
 * Check if section is first
 */
export const isFirstSection = (sectionId) => getSectionIndex(sectionId) === 0;

/**
 * Check if section is last
 */
export const isLastSection = (sectionId) => getSectionIndex(sectionId) === SECTION_ORDER.length - 1;
