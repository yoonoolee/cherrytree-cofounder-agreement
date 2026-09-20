import type { SurveyData, SurveyFieldName } from '@cherrytree/shared';

/**
 * Short display string for a question's current answer, used in a
 * QuestionCard's collapsed answerPreview.
 * - Arrays (checkbox/multi-select answers) join into a comma-separated list.
 * - Acknowledgment objects (collaboratorId -> boolean) become
 *   'Acknowledged' / 'In progress' / ''.
 * - Everything else is stringified as-is.
 * - If otherFieldName is given and the answer is (or includes) 'Other', the
 *   actual typed-in text from that field is shown instead of the literal word "Other".
 */
export const getPreview = (
  fieldName: SurveyFieldName,
  formData: Partial<SurveyData>,
  otherFieldName?: SurveyFieldName,
): string => {
  const val: unknown = formData[fieldName];
  const otherVal: unknown = otherFieldName ? formData[otherFieldName] : undefined;
  if (!val) return '';
  if (Array.isArray(val)) {
    const items: unknown[] = val;
    return items.map((v) => (v === 'Other' && otherVal ? text(otherVal) : text(v))).join(', ');
  }
  if (typeof val === 'object') {
    const vals = Object.values(val);
    if (!vals.length) return '';
    if (vals.every(Boolean)) return 'Acknowledged';
    if (vals.some(Boolean)) return 'In progress';
    return '';
  }
  if (val === 'Other' && otherVal) return text(otherVal);
  return text(val);
};

/** A stored answer as display text: strings as-is, numbers/booleans stringified, else ''. */
function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}
