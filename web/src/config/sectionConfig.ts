/**
 * Display metadata for each survey section (navigation labels, icons, intro copy).
 * Section identifiers and ordering live in `@cherrytree/shared`; this file is UI-only.
 */
import { SECTION_IDS, type SectionId } from '@cherrytree/shared';

export interface SectionMeta {
  displayName: string;
  icon: string;
  description: string;
}

export const SECTIONS: Record<SectionId, SectionMeta> = {
  [SECTION_IDS.FORMATION]: {
    displayName: 'Formation & Purpose',
    icon: '🏢',
    description:
      "You've been talking about this idea for weeks, maybe months. Now you're sitting with your cofounder, naming the company, buying the domain, imagining what it could become. Coffee in hand, takeout on the table. Creating a cofounder agreement is what makes it real. Let's get started.",
  },
  [SECTION_IDS.COFOUNDERS]: {
    displayName: 'Cofounder Info',
    icon: '👥',
    description:
      "Whether it's just the two of you or if there's a dozen of you, this is the crew that decided to go for it. Names, roles, contact info, sure. But it's also a snapshot of the team before the world knows your name. Someday, this will be the \"garage team\" story you tell in interviews.",
  },
  [SECTION_IDS.EQUITY_ALLOCATION]: {
    displayName: 'Equity Allocation',
    icon: '📊',
    description:
      "Be very reluctant to change equity allocation once you've agreed. The #1 reason for cofounder breakups in the most recent YC batch was cofounders trying to revisit a settled split.",
  },
  [SECTION_IDS.VESTING]: {
    displayName: 'Vesting Schedule',
    icon: '📅',
    description:
      'This is exactly why vesting exists. Without it, a cofounder can walk away with a huge slice of the company without putting in the work, leaving the remaining cofounders carrying the burden. Vesting means you earn your equity over time by building the company.',
  },
  [SECTION_IDS.DECISION_MAKING]: {
    displayName: 'Decision-Making',
    icon: '⚖️',
    description:
      'Without a plan for who decides what, even choosing office chairs can start a cold war. The day-to-day questions start piling up. Should we hire this engineer? Take that investor meeting? Pivot the product? Left undefined, these decisions can quietly blow up trust.\n\nThis section is where you make it concrete: who signs off on what, when a decision needs a vote, and how ties get broken. Defining it now means that when disagreements inevitably come, you have a clear, agreed-upon way to move forward without derailing.',
  },
  [SECTION_IDS.IP]: {
    displayName: 'IP & Ownership',
    icon: '💡',
    description: 'Without being specific about IP, even college buddies can turn on each other.',
  },
  [SECTION_IDS.COMPENSATION]: {
    displayName: 'Compensation',
    icon: '💰',
    description:
      "Money issues cause more divorce than infidelity and incompatibility. It'd be naive to think cofounderships are immune. Don't wait until someone is frustrated over uneven pay or unclear expenses. Agree on how money flows now and keep communication transparent to avoid costly fallout.",
  },
  [SECTION_IDS.PERFORMANCE]: {
    displayName: 'Performance',
    icon: '📈',
    description:
      "In those cases, the best we can do is protect the company and the friendship. You do that by planning for the what-ifs ahead of time. Performance isn't just about grinding harder. It's about foresight, flexibility, and keeping the company moving even when things don't go perfectly.",
  },
  [SECTION_IDS.NON_COMPETITION]: {
    displayName: 'Non-Competition',
    icon: '🔒',
    description:
      "You know how when you go to a bar with your friend, you have an unspoken agreement to not hit on the same person? Confidentiality, Non-Competition and Non-Solicitation kind of work the same way. They take the unspoken worries off the table so nothing turns awkward later. Make sure everyone knows what's off limits.",
  },
  [SECTION_IDS.GENERAL_PROVISIONS]: {
    displayName: 'General Provisions',
    icon: '📋',
    description:
      'Last stretch! Knock out these last few questions, then review and green-light your agreement.',
  },
};

/**
 * `SurveyNavigation.currentSection` values for the pages after the survey. The navigation
 * only compares `currentSection` against survey section ids, so these mark no section active.
 * `GENERATED_AGREEMENT_ID` is also what `FinalAgreement.onEdit` receives for "go to Review & Approve".
 */
export const GENERATED_AGREEMENT_ID = 'generated-agreement';
export const FINAL_AGREEMENT_ID = 'final-agreement';
