/**
 * Question Configuration
 *
 * Single source of truth for all survey questions, their types, options, and metadata.
 * Used for:
 * - Rendering form fields
 * - Search functionality
 * - Validation
 * - Progress tracking
 */

import { FIELDS } from './surveySchema';
import { SECTION_IDS } from './sectionConfig';
import {
  ENTITY_TYPES,
  INDUSTRIES,
  ROLES,
  MAJOR_DECISIONS,
  TIE_RESOLUTION_OPTIONS,
  VESTING_SCHEDULES,
  VESTED_SHARES_DISPOSAL_OPTIONS,
  PERFORMANCE_CONSEQUENCES,
  TERMINATION_WITH_CAUSE_OPTIONS,
  NON_COMPETE_DURATIONS,
  NON_SOLICIT_DURATIONS,
  DISPUTE_RESOLUTION_OPTIONS,
  US_STATES,
  AMENDMENT_PROCESS_OPTIONS,
} from './surveySchema';

// Input type constants
export const INPUT_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  DATE: 'date',
  RADIO: 'radio',           // Single selection, circular buttons
  CHECKBOX: 'checkbox',     // Multiple selections, square boxes
  DROPDOWN: 'dropdown',     // Select dropdown
  ACKNOWLEDGMENT: 'acknowledgment', // Multi-user checkboxes
  CUSTOM: 'custom',         // Custom components (Equity Calculator, etc.)
};

/**
 * Question configuration for all fields
 * If otherField is present, "Other" option is automatically included
 */
export const QUESTION_CONFIG = {
  // ============================================================================
  // Section 1: Formation & Purpose
  // ============================================================================

  [FIELDS.COMPANY_NAME]: {
    section: SECTION_IDS.FORMATION,
    question: "What's your company's name?",
    type: INPUT_TYPES.TEXT,
    required: true,
    placeholder: 'Acme Inc.',
  },

  [FIELDS.ENTITY_TYPE]: {
    section: SECTION_IDS.FORMATION,
    question: "What is your company's current or intended legal structure?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: ENTITY_TYPES,
    otherField: FIELDS.ENTITY_TYPE_OTHER,
  },

  [FIELDS.REGISTERED_STATE]: {
    section: SECTION_IDS.FORMATION,
    question: "What state will your company be registered in?",
    type: INPUT_TYPES.TEXT, // Uses custom autocomplete
    required: true,
  },

  [FIELDS.MAILING_STREET]: {
    section: SECTION_IDS.FORMATION,
    question: "Mailing Street Address",
    type: INPUT_TYPES.TEXT,
    required: true,
  },

  [FIELDS.MAILING_CITY]: {
    section: SECTION_IDS.FORMATION,
    question: "City",
    type: INPUT_TYPES.TEXT,
    required: true,
  },

  [FIELDS.MAILING_STATE]: {
    section: SECTION_IDS.FORMATION,
    question: "State",
    type: INPUT_TYPES.TEXT,
    required: true,
  },

  [FIELDS.MAILING_ZIP]: {
    section: SECTION_IDS.FORMATION,
    question: "ZIP Code",
    type: INPUT_TYPES.TEXT,
    required: true,
  },

  [FIELDS.COMPANY_DESCRIPTION]: {
    section: SECTION_IDS.FORMATION,
    question: "Can you describe your company in 1 line?",
    type: INPUT_TYPES.TEXTAREA,
    required: true,
    placeholder: 'We help...',
  },

  [FIELDS.INDUSTRIES]: {
    section: SECTION_IDS.FORMATION,
    question: "What industry is it in?",
    type: INPUT_TYPES.CHECKBOX,
    required: true,
    options: INDUSTRIES,
    otherField: FIELDS.INDUSTRY_OTHER,
  },

  // ============================================================================
  // Section 2: Cofounder Info
  // ============================================================================

  [FIELDS.COFOUNDER_COUNT]: {
    section: SECTION_IDS.COFOUNDERS,
    question: "How many cofounders are there?",
    type: INPUT_TYPES.NUMBER,
    required: true,
  },

  // Nested fields (inside cofounders array)
  [FIELDS.COFOUNDER_FULL_NAME]: {
    section: SECTION_IDS.COFOUNDERS,
    question: "Full Name",
    type: INPUT_TYPES.TEXT,
    required: true,
    nested: true,
    parentField: FIELDS.COFOUNDERS,
  },

  [FIELDS.COFOUNDER_TITLE]: {
    section: SECTION_IDS.COFOUNDERS,
    question: "Title",
    type: INPUT_TYPES.TEXT,
    required: true,
    nested: true,
    parentField: FIELDS.COFOUNDERS,
  },

  [FIELDS.COFOUNDER_EMAIL]: {
    section: SECTION_IDS.COFOUNDERS,
    question: "Email",
    type: INPUT_TYPES.TEXT,
    required: true,
    nested: true,
    parentField: FIELDS.COFOUNDERS,
  },

  [FIELDS.COFOUNDER_ROLES]: {
    section: SECTION_IDS.COFOUNDERS,
    question: "Roles & Responsibilities",
    type: INPUT_TYPES.CHECKBOX,
    required: true,
    options: ROLES,
    otherField: FIELDS.COFOUNDER_ROLES_OTHER,
    nested: true,
    parentField: FIELDS.COFOUNDERS,
  },

  // ============================================================================
  // Section 3: Equity Allocation
  // ============================================================================

  [FIELDS.FINAL_EQUITY_PERCENTAGES]: {
    section: SECTION_IDS.EQUITY_ALLOCATION,
    question: "Final Equity Allocation",
    type: INPUT_TYPES.CUSTOM,
    required: true,
    requiresAllCollaborators: true,
  },

  [FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION]: {
    section: SECTION_IDS.EQUITY_ALLOCATION,
    question: "I acknowledge and accept this equity allocation",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
  },

  // ============================================================================
  // Section 4: Vesting Schedule
  // ============================================================================

  [FIELDS.VESTING_START_DATE]: {
    section: SECTION_IDS.VESTING,
    question: "What date should the vesting start?",
    type: INPUT_TYPES.DATE,
    required: true,
    tooltip: "This can start today or retroactively when the work began.",
  },

  [FIELDS.VESTING_SCHEDULE]: {
    section: SECTION_IDS.VESTING,
    question: "What vesting schedule will you use?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: VESTING_SCHEDULES,
    otherField: FIELDS.VESTING_SCHEDULE_OTHER,
    tooltip: 'You earn no equity until the "cliff" is hit. Then, once the cliff is reached, you immediately vest the first portion of your equity, and the rest continues to vest gradually over the remaining period.',
  },

  [FIELDS.CLIFF_PERCENTAGE]: {
    section: SECTION_IDS.VESTING,
    question: "What percent of equity will be vested once the cliff is complete?",
    type: INPUT_TYPES.TEXT, // Percentage input with custom formatting
    required: true,
    tooltip: "If you leave before the cliff, you get nothing.",
  },

  [FIELDS.ACCELERATION_TRIGGER]: {
    section: SECTION_IDS.VESTING,
    question: "If the company is acquired and a cofounder is terminated without cause, should their unvested shares accelerate?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: ['Yes', 'No'],
    tooltip: "Acceleration decides if unvested shares vest early. Single-trigger happens when the company is acquired. Double-trigger only kicks in if the company is acquired and you're terminated without cause.",
  },

  [FIELDS.SHARES_SELL_NOTICE_DAYS]: {
    section: SECTION_IDS.VESTING,
    question: "If a cofounder wants to sell their shares, how many days notice do they need to provide the Board and shareholders?",
    type: INPUT_TYPES.NUMBER,
    required: true,
  },

  [FIELDS.SHARES_BUYBACK_DAYS]: {
    section: SECTION_IDS.VESTING,
    question: "If a cofounder resigns, how many days does the company have to buy back the shares?",
    type: INPUT_TYPES.NUMBER,
    required: true,
  },

  [FIELDS.ACKNOWLEDGE_FORFEITURE]: {
    section: SECTION_IDS.VESTING,
    question: "You acknowledge that if a cofounder dies, becomes permanently disabled, or is otherwise incapacitated, their unvested shares are automatically forfeited and returned to the company.",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
    tooltip: "Knock on wood.",
  },

  [FIELDS.VESTED_SHARES_DISPOSAL]: {
    section: SECTION_IDS.VESTING,
    question: "If a cofounder dies, becomes permanently disabled, or is otherwise incapacitated:",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: VESTED_SHARES_DISPOSAL_OPTIONS,
  },

  // ============================================================================
  // Section 5: Decision-Making
  // ============================================================================

  [FIELDS.MAJOR_DECISIONS]: {
    section: SECTION_IDS.DECISION_MAKING,
    question: "What types of decisions should require unanimous or majority approval?",
    type: INPUT_TYPES.CHECKBOX,
    required: true,
    options: MAJOR_DECISIONS,
    otherField: FIELDS.MAJOR_DECISIONS_OTHER,
  },

  [FIELDS.EQUITY_VOTING_POWER]: {
    section: SECTION_IDS.DECISION_MAKING,
    question: "Should equity ownership reflect voting power?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: ['Yes', 'No'],
  },

  [FIELDS.TIE_RESOLUTION]: {
    section: SECTION_IDS.DECISION_MAKING,
    question: "If cofounders are deadlocked, how should the tie be resolved?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: TIE_RESOLUTION_OPTIONS,
    tooltip: "Decide how to break a stalemate before it becomes a staring contest nobody wins.",
  },

  [FIELDS.ACKNOWLEDGE_TIE_RESOLUTION]: {
    section: SECTION_IDS.DECISION_MAKING,
    question: "Acknowledge tie resolution process",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
  },

  [FIELDS.INCLUDE_SHOTGUN_CLAUSE]: {
    section: SECTION_IDS.DECISION_MAKING,
    question: "Do you want to include a shotgun clause if you and your cofounder(s) cannot resolve deadlocks?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: ['Yes', 'No'],
  },

  [FIELDS.ACKNOWLEDGE_SHOTGUN_CLAUSE]: {
    section: SECTION_IDS.DECISION_MAKING,
    question: "Acknowledge shotgun clause",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
    conditionalOn: { field: FIELDS.INCLUDE_SHOTGUN_CLAUSE, value: 'Yes' },
  },

  // ============================================================================
  // Section 6: IP & Ownership
  // ============================================================================

  [FIELDS.HAS_PRE_EXISTING_IP]: {
    section: SECTION_IDS.IP,
    question: "Has any cofounder created code, designs, or other assets before joining the company that might be used in the business?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: ['Yes', 'No'],
    tooltip: "Nail down ownership now, or risk ugly debates later over who really owns what once the company takes off.",
  },

  [FIELDS.ACKNOWLEDGE_IP_ASSIGNMENT]: {
    section: SECTION_IDS.IP,
    question: "Any pre-existing IP can be assigned to the company via a written agreement if the cofounders agree",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
    conditionalOn: { field: FIELDS.HAS_PRE_EXISTING_IP, value: 'Yes' },
  },

  [FIELDS.ACKNOWLEDGE_IP_OWNERSHIP]: {
    section: SECTION_IDS.IP,
    question: "Each Cofounder agrees that all inventions, discoveries, designs, developments, improvements, processes, works of authorship, trade secrets, and other intellectual property conceived, created, developed, or reduced to practice by the Cofounder, either alone or with others, in the course of their work for the Company or using the Company's resources, shall be the sole and exclusive property of the Company.",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
  },

  // ============================================================================
  // Section 7: Compensation
  // ============================================================================

  [FIELDS.TAKING_COMPENSATION]: {
    section: SECTION_IDS.COMPENSATION,
    question: "Are any cofounders currently taking compensation or salary from the company?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: ['Yes', 'No'],
  },

  [FIELDS.COMPENSATIONS]: {
    section: SECTION_IDS.COMPENSATION,
    question: "Compensation Details",
    type: INPUT_TYPES.CUSTOM,
    required: false,
    conditionalOn: { field: FIELDS.TAKING_COMPENSATION, value: 'Yes' },
  },

  [FIELDS.SPENDING_LIMIT]: {
    section: SECTION_IDS.COMPENSATION,
    question: "What's the spending limit, in USD, before a cofounder needs to check with other cofounders?",
    type: INPUT_TYPES.NUMBER,
    required: true,
  },

  // ============================================================================
  // Section 8: Performance
  // ============================================================================

  [FIELDS.PERFORMANCE_CONSEQUENCES]: {
    section: SECTION_IDS.PERFORMANCE,
    question: "What happens if a cofounder fails to meet their agreed-upon obligations?",
    type: INPUT_TYPES.CHECKBOX,
    required: true,
    options: PERFORMANCE_CONSEQUENCES,
    tooltip: "These measures are intended for serious, ongoing failures to meet material obligations, not for minor issues or temporary setbacks.",
  },

  [FIELDS.REMEDY_PERIOD_DAYS]: {
    section: SECTION_IDS.PERFORMANCE,
    question: "How many days does a cofounder have to fix the issue after receiving written notice before termination can occur?",
    type: INPUT_TYPES.NUMBER,
    required: true,
    tooltip: "This period allows cofounders to address issues in good faith before more serious action is taken.",
  },

  [FIELDS.TERMINATION_WITH_CAUSE]: {
    section: SECTION_IDS.PERFORMANCE,
    question: "Which of the following constitutes termination with cause?",
    type: INPUT_TYPES.CHECKBOX,
    required: true,
    options: TERMINATION_WITH_CAUSE_OPTIONS,
    otherField: FIELDS.TERMINATION_WITH_CAUSE_OTHER,
    tooltip: "Basically, what kind of bad behavior gets you booted.",
  },

  [FIELDS.VOLUNTARY_NOTICE_DAYS]: {
    section: SECTION_IDS.PERFORMANCE,
    question: "How many days is the notice period if a Cofounder wishes to voluntarily leave?",
    type: INPUT_TYPES.NUMBER,
    required: true,
  },

  // ============================================================================
  // Section 9: Non-Competition
  // ============================================================================

  [FIELDS.ACKNOWLEDGE_CONFIDENTIALITY]: {
    section: SECTION_IDS.NON_COMPETITION,
    question: "Each Cofounder agrees to hold all Confidential Information in strict confidence and not to disclose any Confidential Information to any third party without the Company's prior written consent.",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
  },

  [FIELDS.NON_COMPETE_DURATION]: {
    section: SECTION_IDS.NON_COMPETITION,
    question: "How long should the non-competition obligation last after a cofounder leaves?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: NON_COMPETE_DURATIONS,
    otherField: FIELDS.NON_COMPETE_DURATION_OTHER,
    tooltip: "This includes joining or starting a competing company. Note: Non-compete agreements may not be enforceable in certain states (e.g., California).",
  },

  [FIELDS.NON_SOLICIT_DURATION]: {
    section: SECTION_IDS.NON_COMPETITION,
    question: "How long should the non-solicitation obligation last after a cofounder leaves?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: NON_SOLICIT_DURATIONS,
    otherField: FIELDS.NON_SOLICIT_DURATION_OTHER,
    tooltip: "Non-solicitation prevents a cofounder who leaves from recruiting the Company's team or clients for a certain period.",
  },

  // ============================================================================
  // Section 10: General Provisions
  // ============================================================================

  [FIELDS.DISPUTE_RESOLUTION]: {
    section: SECTION_IDS.GENERAL_PROVISIONS,
    question: "How should disputes among cofounders be resolved?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: DISPUTE_RESOLUTION_OPTIONS,
    otherField: FIELDS.DISPUTE_RESOLUTION_OTHER,
  },

  [FIELDS.GOVERNING_LAW]: {
    section: SECTION_IDS.GENERAL_PROVISIONS,
    question: "Which state's laws will govern this agreement?",
    type: INPUT_TYPES.DROPDOWN,
    required: true,
    options: US_STATES.map(state => state.label),
  },

  [FIELDS.AMENDMENT_PROCESS]: {
    section: SECTION_IDS.GENERAL_PROVISIONS,
    question: "How can this agreement be amended or modified?",
    type: INPUT_TYPES.RADIO,
    required: true,
    options: AMENDMENT_PROCESS_OPTIONS,
    otherField: FIELDS.AMENDMENT_PROCESS_OTHER,
  },

  [FIELDS.REVIEW_FREQUENCY_MONTHS]: {
    section: SECTION_IDS.GENERAL_PROVISIONS,
    question: "How often (in months) should this agreement be reviewed by the cofounders?",
    type: INPUT_TYPES.NUMBER,
    required: true,
  },

  [FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW]: {
    section: SECTION_IDS.GENERAL_PROVISIONS,
    question: "Each Cofounder acknowledges that this Agreement shall be reviewed periodically to ensure it remains current and effective.",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
  },

  [FIELDS.ACKNOWLEDGE_AMENDMENT_REVIEW_REQUEST]: {
    section: SECTION_IDS.GENERAL_PROVISIONS,
    question: "Any Cofounder may request a review of this Agreement in the event of material changes in circumstances affecting the Company or the Cofounder's role.",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
  },

  [FIELDS.ACKNOWLEDGE_ENTIRE_AGREEMENT]: {
    section: SECTION_IDS.GENERAL_PROVISIONS,
    question: "Each Cofounder acknowledges that this Agreement constitutes the entire agreement between the Cofounders regarding the subject matter hereof and supersedes all prior agreements, understandings, negotiations, and discussions, whether oral or written.",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
  },

  [FIELDS.ACKNOWLEDGE_SEVERABILITY]: {
    section: SECTION_IDS.GENERAL_PROVISIONS,
    question: "Each Cofounder acknowledges that if any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.",
    type: INPUT_TYPES.ACKNOWLEDGMENT,
    required: true,
    requiresAllCollaborators: true,
  },
};

/**
 * Get all questions for a specific section
 */
export const getQuestionsBySection = (sectionId) => {
  return Object.entries(QUESTION_CONFIG)
    .filter(([_, config]) => config.section === sectionId)
    .map(([fieldName, config]) => ({ fieldName, ...config }));
};

/**
 * Get question config by field name
 */
export const getQuestionConfig = (fieldName) => {
  return QUESTION_CONFIG[fieldName];
};

/**
 * Check if field has "Other" option
 */
export const hasOtherOption = (fieldName) => {
  return !!QUESTION_CONFIG[fieldName]?.otherField;
};
