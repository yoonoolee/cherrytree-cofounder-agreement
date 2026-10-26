/**
 * Prints the JSON Schema that the agent service's Pydantic models are generated from
 * (`npm run generate:agent-types`). Lists every schema the agent service reads, writes or serves;
 * each becomes a class of that name, and the schemas it references become classes too.
 */
import { z } from 'zod';

import {
  advisorQuestionSchema,
  advisorResponseSchema,
  advisorSessionResponseSchema,
  advisorStateSchema,
  advisorStreamEventSchema,
  advisorTurnRequestSchema,
  advisorTurnSchema,
  draftBlockSchema,
  draftDocumentRequestSchema,
  draftDocumentResponseSchema,
  draftFixSchema,
  draftSchema,
  draftStatusSchema,
  draftThreadAnchorSchema,
  editSchema,
  initialQuestionsSchema,
  memberSchema,
  paymentSchema,
  plateElementSchema,
  plateTextSchema,
  projectSchema,
  questionSchema,
  questionSectionSchema,
  questionStatusSchema,
  rateLimitSchema,
  startDraftResponseSchema,
  suggestionSchema,
  threadMessageSchema,
  threadSchema,
  transcriptEntrySchema,
  webSourceSchema,
} from '../src/index.ts';

const AGENT_SCHEMAS: Record<string, z.ZodType> = {
  Project: projectSchema,
  Member: memberSchema,
  RateLimit: rateLimitSchema,
  Payment: paymentSchema,
  WebSource: webSourceSchema,
  QuestionStatus: questionStatusSchema,
  Question: questionSchema,
  QuestionSection: questionSectionSchema,
  InitialQuestions: initialQuestionsSchema,
  InitialQuestionSection: initialQuestionsSchema.shape.sections.element,
  InitialQuestion: initialQuestionsSchema.shape.sections.element.shape.questions.element,
  AdvisorState: advisorStateSchema,
  AdvisorQuestion: advisorQuestionSchema,
  AdvisorResponse: advisorResponseSchema,
  AdvisorTurn: advisorTurnSchema,
  TranscriptEntry: transcriptEntrySchema,
  PlateText: plateTextSchema,
  PlateElement: plateElementSchema,
  DraftBlock: draftBlockSchema,
  DraftStatus: draftStatusSchema,
  Draft: draftSchema,
  ThreadMessage: threadMessageSchema,
  Thread: threadSchema,
  Edit: editSchema,
  Suggestion: suggestionSchema,
  DraftFix: draftFixSchema,
  DraftThreadAnchor: draftThreadAnchorSchema,
  DraftDocumentRequest: draftDocumentRequestSchema,
  DraftFromMarkdownRequest: draftDocumentRequestSchema.options[0],
  DraftApplyReviewRequest: draftDocumentRequestSchema.options[1],
  DraftDocumentResponse: draftDocumentResponseSchema,
  AdvisorSessionResponse: advisorSessionResponseSchema,
  AdvisorTurnRequest: advisorTurnRequestSchema,
  AdvisorStreamEvent: advisorStreamEventSchema,
  StartDraftResponse: startDraftResponseSchema,
  // One class per event, e.g. `answer_delta` → AdvisorAnswerDeltaEvent.
  ...Object.fromEntries(
    advisorStreamEventSchema.options.map((event) => [
      `Advisor${event.shape.type.value.replace(/(^|_)(\w)/g, (_, _sep, c: string) => c.toUpperCase())}Event`,
      event,
    ]),
  ),
};

const registry = z.registry<{ id: string }>();
for (const [id, schema] of Object.entries(AGENT_SCHEMAS)) {
  registry.add(schema, { id });
}

// `unrepresentable: 'any'` lets z.custom through; timestamps carry their schema in `.meta()`.
const { schemas } = z.toJSONSchema(registry, {
  io: 'output',
  unrepresentable: 'any',
  uri: (id) => `#/$defs/${id}`,
});

const $defs = Object.fromEntries(
  Object.entries(schemas).map(([id, { $schema: _schema, $id: _id, ...definition }]) => [
    id,
    definition,
  ]),
);

process.stdout.write(
  `${JSON.stringify({ $schema: 'https://json-schema.org/draft/2020-12/schema', $defs }, null, 2)}\n`,
);
