/**
 * Survey Schema for Cloud Functions
 *
 * Configuration for "Other" field merging before sending to Make.com for PDF generation.
 * Must stay in sync with src/config/surveySchema.js
 *
 * Supports dot notation for nested fields at any depth:
 * - Top-level: { field: 'industries', otherField: 'industryOther', type: 'array' }
 * - Nested in array: { field: 'cofounders.roles', otherField: 'rolesOther', type: 'array' }
 * - Deeply nested: { field: 'company.settings.theme', otherField: 'themeOther', type: 'string' }
 *
 * The otherField is always at the same level as the last segment of the path.
 */

// Field name constants (subset of frontend FIELDS - only what's needed here)
const FIELDS = {
  INDUSTRIES: 'industries',
  INDUSTRY_OTHER: 'industryOther',
  MAJOR_DECISIONS: 'majorDecisions',
  MAJOR_DECISIONS_OTHER: 'majorDecisionsOther',
  TERMINATION_WITH_CAUSE: 'terminationWithCause',
  TERMINATION_WITH_CAUSE_OTHER: 'terminationWithCauseOther',
  COFOUNDERS: 'cofounders',
  COFOUNDER_ROLES: 'roles',
  COFOUNDER_ROLES_OTHER: 'rolesOther',
  ENTITY_TYPE: 'entityType',
  ENTITY_TYPE_OTHER: 'entityTypeOther',
  VESTING_SCHEDULE: 'vestingSchedule',
  VESTING_SCHEDULE_OTHER: 'vestingScheduleOther',
  NON_COMPETE_DURATION: 'nonCompeteDuration',
  NON_COMPETE_DURATION_OTHER: 'nonCompeteDurationOther',
  NON_SOLICIT_DURATION: 'nonSolicitDuration',
  NON_SOLICIT_DURATION_OTHER: 'nonSolicitDurationOther',
  DISPUTE_RESOLUTION: 'disputeResolution',
  DISPUTE_RESOLUTION_OTHER: 'disputeResolutionOther',
  AMENDMENT_PROCESS: 'amendmentProcess',
  AMENDMENT_PROCESS_OTHER: 'amendmentProcessOther',
};

/**
 * All acknowledgment field names (per-user approval fields)
 * Used for initializing collaborator entries when they join a project
 */
/**
 * Acknowledgment fields initialized on project creation and collaborator join.
 */
const REQUIRED_ACKNOWLEDGMENT_FIELDS = [
  'acknowledgeEquityAllocation',
  'acknowledgeForfeiture',
  'acknowledgeIPOwnership',
  'acknowledgeConfidentiality',
  'acknowledgePeriodicReview',
  'acknowledgeAmendmentReviewRequest',
  'acknowledgeEntireAgreement',
  'acknowledgeSeverability',
];

/**
 * Acknowledgment fields created/deleted dynamically based on a parent question.
 * Only initialized for collaborators if they already exist in surveyData.
 */
const CONDITIONAL_ACKNOWLEDGMENT_FIELDS = [
  'acknowledgeTieResolution',
  'acknowledgeShotgunClause',
  'acknowledgeIPAssignment',
];

const OTHER_FIELD_CONFIG = [
  // Array fields
  { field: FIELDS.INDUSTRIES, otherField: FIELDS.INDUSTRY_OTHER, type: 'array' },
  { field: FIELDS.MAJOR_DECISIONS, otherField: FIELDS.MAJOR_DECISIONS_OTHER, type: 'array' },
  { field: FIELDS.TERMINATION_WITH_CAUSE, otherField: FIELDS.TERMINATION_WITH_CAUSE_OTHER, type: 'array' },

  // Nested array fields (inside cofounders array)
  { field: `${FIELDS.COFOUNDERS}.${FIELDS.COFOUNDER_ROLES}`, otherField: FIELDS.COFOUNDER_ROLES_OTHER, type: 'array' },

  // String fields
  { field: FIELDS.ENTITY_TYPE, otherField: FIELDS.ENTITY_TYPE_OTHER, type: 'string' },
  { field: FIELDS.VESTING_SCHEDULE, otherField: FIELDS.VESTING_SCHEDULE_OTHER, type: 'string' },
  { field: FIELDS.NON_COMPETE_DURATION, otherField: FIELDS.NON_COMPETE_DURATION_OTHER, type: 'string' },
  { field: FIELDS.NON_SOLICIT_DURATION, otherField: FIELDS.NON_SOLICIT_DURATION_OTHER, type: 'string' },
  { field: FIELDS.DISPUTE_RESOLUTION, otherField: FIELDS.DISPUTE_RESOLUTION_OTHER, type: 'string' },
  { field: FIELDS.AMENDMENT_PROCESS, otherField: FIELDS.AMENDMENT_PROCESS_OTHER, type: 'string' },
];

const OTHER_FIELD_NAMES = OTHER_FIELD_CONFIG.map(config => config.otherField);

/**
 * Recursively traverses nested paths and processes "Other" fields
 */
function processNestedField(obj, pathParts, otherField, type) {
  function traverse(current, parts) {
    if (!current || typeof current !== 'object') return;

    const currentKey = parts[0];
    const isLastPart = parts.length === 1;

    if (isLastPart) {
      // We've reached the field that needs merging
      if (type === 'array' && current[currentKey]?.includes('Other') && current[otherField]) {
        current[currentKey] = current[currentKey].map(item =>
          item === 'Other' ? current[otherField] : item
        );
      } else if (type === 'string' && current[currentKey] === 'Other' && current[otherField]) {
        current[currentKey] = current[otherField];
      }
      delete current[otherField];
    } else {
      // Continue traversing deeper
      const nextValue = current[currentKey];
      const remainingParts = parts.slice(1);

      if (Array.isArray(nextValue)) {
        // If it's an array, process each item
        nextValue.forEach(item => traverse(item, remainingParts));
      } else if (nextValue && typeof nextValue === 'object') {
        // If it's an object, continue traversing
        traverse(nextValue, remainingParts);
      }
    }
  }

  traverse(obj, pathParts);
}

function mergeOtherFields(surveyData) {
  if (!surveyData) return {};

  const merged = { ...surveyData };

  for (const { field, otherField, type } of OTHER_FIELD_CONFIG) {
    const pathParts = field.split('.');

    if (pathParts.length === 1) {
      // Top-level field (existing logic)
      if (type === 'array' && merged[field]?.includes('Other') && merged[otherField]) {
        merged[field] = merged[field].map(item => item === 'Other' ? merged[otherField] : item);
      } else if (type === 'string' && merged[field] === 'Other' && merged[otherField]) {
        merged[field] = merged[otherField];
      }
      delete merged[otherField];
    } else {
      // Nested field - use recursive helper
      processNestedField(merged, pathParts, otherField, type);
    }
  }

  return merged;
}

module.exports = {
  REQUIRED_ACKNOWLEDGMENT_FIELDS,
  CONDITIONAL_ACKNOWLEDGMENT_FIELDS,
  OTHER_FIELD_CONFIG,
  OTHER_FIELD_NAMES,
  mergeOtherFields
};
