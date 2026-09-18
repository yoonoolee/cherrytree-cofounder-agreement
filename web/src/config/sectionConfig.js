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
    description: "You've been talking about this idea for weeks, maybe months. Now you're sitting with your cofounder, naming the company, buying the domain, imagining what it could become. Coffee in hand, takeout on the table. Creating a cofounder agreement is what makes it real. Let's get started.",
  },
  [SECTION_IDS.COFOUNDERS]: {
    displayName: 'Cofounder Info',
    icon: '👥',
    description: "Whether it's just the two of you or if there's a dozen of you, this is the crew that decided to go for it. Names, roles, contact info, sure. But it's also a snapshot of the team before the world knows your name. Someday, this will be the \"garage team\" story you tell in interviews.",
  },
  [SECTION_IDS.EQUITY_ALLOCATION]: {
    displayName: 'Equity Allocation',
    icon: '📊',
    description: "Be very reluctant to change equity allocation once you've agreed. The #1 reason for cofounder breakups in the most recent YC batch was cofounders trying to revisit a settled split.",
  },
  [SECTION_IDS.VESTING]: {
    displayName: 'Vesting Schedule',
    icon: '📅',
    description: "This is exactly why vesting exists. Without it, a cofounder can walk away with a huge slice of the company without putting in the work, leaving the remaining cofounders carrying the burden. Vesting means you earn your equity over time by building the company.",
  },
  [SECTION_IDS.DECISION_MAKING]: {
    displayName: 'Decision-Making',
    icon: '⚖️',
    description: "Without a plan for who decides what, even choosing office chairs can start a cold war. The day-to-day questions start piling up. Should we hire this engineer? Take that investor meeting? Pivot the product? Left undefined, these decisions can quietly blow up trust.\n\nThis section is where you make it concrete: who signs off on what, when a decision needs a vote, and how ties get broken. Defining it now means that when disagreements inevitably come, you have a clear, agreed-upon way to move forward without derailing.",
  },
  [SECTION_IDS.IP]: {
    displayName: 'IP & Ownership',
    icon: '💡',
    description: "Without being specific about IP, even college buddies can turn on each other.",
  },
  [SECTION_IDS.COMPENSATION]: {
    displayName: 'Compensation',
    icon: '💰',
    description: "Money issues cause more divorce than infidelity and incompatibility. It'd be naive to think cofounderships are immune. Don't wait until someone is frustrated over uneven pay or unclear expenses. Agree on how money flows now and keep communication transparent to avoid costly fallout.",
  },
  [SECTION_IDS.PERFORMANCE]: {
    displayName: 'Performance',
    icon: '📈',
    description: "In those cases, the best we can do is protect the company and the friendship. You do that by planning for the what-ifs ahead of time. Performance isn't just about grinding harder. It's about foresight, flexibility, and keeping the company moving even when things don't go perfectly.",
  },
  [SECTION_IDS.NON_COMPETITION]: {
    displayName: 'Non-Competition',
    icon: '🔒',
    description: "You know how when you go to a bar with your friend, you have an unspoken agreement to not hit on the same person? Confidentiality, Non-Competition and Non-Solicitation kind of work the same way. They take the unspoken worries off the table so nothing turns awkward later. Make sure everyone knows what's off limits.",
  },
  [SECTION_IDS.GENERAL_PROVISIONS]: {
    displayName: 'General Provisions',
    icon: '📋',
    description: "Last stretch! Knock out these last few questions, then review and green-light your agreement.",
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
