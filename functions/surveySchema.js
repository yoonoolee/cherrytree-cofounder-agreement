/**
 * Survey Schema for Cloud Functions
 *
 * Configuration for "Other" field merging before sending to Make.com for PDF generation.
 * Must stay in sync with src/config/surveySchema.js
 */

const OTHER_FIELD_CONFIG = [
  // Array fields
  { field: 'industries', otherField: 'industryOther', type: 'array' },
  { field: 'majorDecisions', otherField: 'majorDecisionsOther', type: 'array' },
  { field: 'terminationWithCause', otherField: 'terminationWithCauseOther', type: 'array' },

  // String fields
  { field: 'entityType', otherField: 'entityTypeOther', type: 'string' },
  { field: 'vestingSchedule', otherField: 'vestingScheduleOther', type: 'string' },
  { field: 'nonCompeteDuration', otherField: 'nonCompeteDurationOther', type: 'string' },
  { field: 'nonSolicitDuration', otherField: 'nonSolicitDurationOther', type: 'string' },
  { field: 'disputeResolution', otherField: 'disputeResolutionOther', type: 'string' },
  { field: 'amendmentProcess', otherField: 'amendmentProcessOther', type: 'string' },
];

const OTHER_FIELD_NAMES = OTHER_FIELD_CONFIG.map(config => config.otherField);

function mergeOtherFields(surveyData) {
  if (!surveyData) return {};

  const merged = { ...surveyData };

  for (const { field, otherField, type } of OTHER_FIELD_CONFIG) {
    if (type === 'array' && merged[field]?.includes('Other') && merged[otherField]) {
      merged[field] = merged[field].map(item => item === 'Other' ? merged[otherField] : item);
    } else if (type === 'string' && merged[field] === 'Other' && merged[otherField]) {
      merged[field] = merged[otherField];
    }
    delete merged[otherField];
  }

  return merged;
}

module.exports = {
  OTHER_FIELD_CONFIG,
  OTHER_FIELD_NAMES,
  mergeOtherFields
};
