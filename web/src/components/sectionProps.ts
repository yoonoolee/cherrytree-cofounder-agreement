import type { SurveyData } from '@cherrytree/shared';

import type { ChangeHandler } from '../hooks/useAutoSave.ts';
import type { CollaboratorSource } from '../hooks/useCollaborators.ts';

/**
 * Props every survey section receives from Survey. `formData` is the full client-side form
 * (useProjectSync merges the schema defaults in), but a stored field can still be `null`
 * (see `clearsFields` in QuestionRenderer), so sections keep their `|| []` / `|| {}` reads.
 */
export interface SurveySectionProps {
  formData: SurveyData;
  handleChange: ChangeHandler;
  isReadOnly: boolean;
  showValidation: boolean;
  /** Needed by acknowledgment questions and per-collaborator inputs; Formation and Performance do without. */
  project?: CollaboratorSource;
}
