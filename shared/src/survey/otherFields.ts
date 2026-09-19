/**
 * "Other" field merging, applied before survey data is sent to Make.com for PDF generation.
 * Firestore keeps the selection and the custom text separate; the PDF gets the merged value.
 *
 * Supports dot notation for nested fields at any depth:
 * - Top-level: { field: 'industries', otherField: 'industryOther', type: 'array' }
 * - Nested in array: { field: 'cofounders.roles', otherField: 'rolesOther', type: 'array' }
 * - Deeply nested: { field: 'company.settings.theme', otherField: 'themeOther', type: 'string' }
 *
 * The otherField is always at the same level as the last segment of the path.
 */
import type { SurveyData } from '../domain/surveyData.ts';
import { FIELDS } from './fields.ts';

export interface OtherFieldConfig {
  /** Dot-separated path to the field holding the selection(s). */
  field: string;
  /** Sibling field holding the custom "Other" text. */
  otherField: string;
  type: 'array' | 'string';
}

export const OTHER_FIELD_CONFIG: readonly OtherFieldConfig[] = [
  // Array fields
  { field: FIELDS.INDUSTRIES, otherField: FIELDS.INDUSTRY_OTHER, type: 'array' },
  { field: FIELDS.MAJOR_DECISIONS, otherField: FIELDS.MAJOR_DECISIONS_OTHER, type: 'array' },
  {
    field: FIELDS.TERMINATION_WITH_CAUSE,
    otherField: FIELDS.TERMINATION_WITH_CAUSE_OTHER,
    type: 'array',
  },

  // Nested array fields (inside cofounders array)
  {
    field: `${FIELDS.COFOUNDERS}.${FIELDS.COFOUNDER_ROLES}`,
    otherField: FIELDS.COFOUNDER_ROLES_OTHER,
    type: 'array',
  },

  // String fields
  { field: FIELDS.ENTITY_TYPE, otherField: FIELDS.ENTITY_TYPE_OTHER, type: 'string' },
  { field: FIELDS.VESTING_SCHEDULE, otherField: FIELDS.VESTING_SCHEDULE_OTHER, type: 'string' },
  {
    field: FIELDS.NON_COMPETE_DURATION,
    otherField: FIELDS.NON_COMPETE_DURATION_OTHER,
    type: 'string',
  },
  {
    field: FIELDS.NON_SOLICIT_DURATION,
    otherField: FIELDS.NON_SOLICIT_DURATION_OTHER,
    type: 'string',
  },
  { field: FIELDS.DISPUTE_RESOLUTION, otherField: FIELDS.DISPUTE_RESOLUTION_OTHER, type: 'string' },
  { field: FIELDS.AMENDMENT_PROCESS, otherField: FIELDS.AMENDMENT_PROCESS_OTHER, type: 'string' },
];

type Loose = Record<string, unknown>;

function isObject(value: unknown): value is Loose {
  return typeof value === 'object' && value !== null;
}

/**
 * Replaces "Other" in `container[key]` with `container[otherField]` (when both are set),
 * then always drops `otherField`. Mutates `container`.
 */
function mergeAtLevel(container: Loose, key: string, otherField: string, type: 'array' | 'string') {
  const value = container[key];
  const other = container[otherField];
  if (type === 'array' && Array.isArray(value) && value.includes('Other') && other) {
    container[key] = value.map((item) => (item === 'Other' ? other : item));
  } else if (type === 'string' && value === 'Other' && other) {
    container[key] = other;
  }
  delete container[otherField];
}

/** Recursively traverses nested paths and processes "Other" fields. */
function processNestedField(
  obj: Loose,
  pathParts: string[],
  otherField: string,
  type: 'array' | 'string',
) {
  function traverse(current: unknown, parts: string[]) {
    if (!isObject(current)) return;

    const [currentKey, ...remainingParts] = parts;
    if (currentKey === undefined) return;

    if (remainingParts.length === 0) {
      // We've reached the field that needs merging
      mergeAtLevel(current, currentKey, otherField, type);
    } else {
      // Continue traversing deeper
      const nextValue = current[currentKey];

      if (Array.isArray(nextValue)) {
        // If it's an array, process each item
        nextValue.forEach((item) => traverse(item, remainingParts));
      } else if (isObject(nextValue)) {
        // If it's an object, continue traversing
        traverse(nextValue, remainingParts);
      }
    }
  }

  traverse(obj, pathParts);
}

/**
 * Returns a copy of `surveyData` with every "Other" selection replaced by its custom text
 * and the `*Other` fields removed. The copy is shallow: nested objects (cofounders) are
 * modified in place — pinned by otherFields.test.ts, do not "fix" without a decision.
 */
export function mergeOtherFields(
  surveyData: Partial<SurveyData> | null | undefined,
): Record<string, unknown> {
  if (!surveyData) return {};

  const merged: Loose = { ...surveyData };

  for (const { field, otherField, type } of OTHER_FIELD_CONFIG) {
    const pathParts = field.split('.');

    if (pathParts.length === 1) {
      // Top-level field
      mergeAtLevel(merged, field, otherField, type);
    } else {
      // Nested field - use recursive helper
      processNestedField(merged, pathParts, otherField, type);
    }
  }

  return merged;
}
