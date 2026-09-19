import { FIELDS, INITIAL_FORM_DATA, SECTION_ORDER } from '@cherrytree/shared';

import { QUESTION_CONFIG } from './questionConfig.ts';

const NESTED_COFOUNDER_FIELDS: readonly string[] = [
  FIELDS.COFOUNDER_FULL_NAME,
  FIELDS.COFOUNDER_TITLE,
  FIELDS.COFOUNDER_EMAIL,
  FIELDS.COFOUNDER_ROLES,
];

const entries = Object.entries(QUESTION_CONFIG);
const surveyFields = new Set(Object.keys(INITIAL_FORM_DATA));

describe('QUESTION_CONFIG', () => {
  it('only describes fields that exist in the survey schema', () => {
    const unknown = entries
      .map(([field]) => field)
      .filter((field) => !surveyFields.has(field) && !NESTED_COFOUNDER_FIELDS.includes(field));
    expect(unknown).toEqual([]);
  });

  it('assigns every question to a known section', () => {
    const sections = new Set<string>(SECTION_ORDER);
    const orphans = entries.filter(([, config]) => !sections.has(config.section));
    expect(orphans.map(([field]) => field)).toEqual([]);
  });

  it('points otherField, conditionalOn and clearsFields at survey fields', () => {
    const broken: string[] = [];
    for (const [field, config] of entries) {
      if ('otherField' in config && config.otherField) {
        const target = config.otherField as string;
        if (!surveyFields.has(target) && target !== FIELDS.COFOUNDER_ROLES_OTHER) {
          broken.push(`${field}.otherField → ${target}`);
        }
      }
      if ('conditionalOn' in config && config.conditionalOn) {
        if (!surveyFields.has(config.conditionalOn.field)) {
          broken.push(`${field}.conditionalOn → ${config.conditionalOn.field}`);
        }
      }
      if ('clearsFields' in config && config.clearsFields) {
        for (const cleared of config.clearsFields.fields) {
          if (!surveyFields.has(cleared.field))
            broken.push(`${field}.clearsFields → ${cleared.field}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('gives every choice question its options and every acknowledgment its collaborator flag', () => {
    const broken: string[] = [];
    for (const [field, config] of entries) {
      if (config.type === 'radio' || config.type === 'checkbox' || config.type === 'dropdown') {
        if (!('options' in config) || config.options.length === 0) broken.push(field);
      }
      if (config.type === 'acknowledgment') {
        if (!('requiresAllCollaborators' in config) || !config.requiresAllCollaborators) {
          broken.push(field);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('marks the nested cofounder fields with their parent', () => {
    for (const field of NESTED_COFOUNDER_FIELDS) {
      const config = QUESTION_CONFIG[field as keyof typeof QUESTION_CONFIG];
      expect(config).toMatchObject({ nested: true, parentField: FIELDS.COFOUNDERS });
    }
  });

  it('renders dynamic acknowledgment text from the answers', () => {
    const periodic = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_PERIODIC_REVIEW];
    expect(periodic.acknowledgmentText({ reviewFrequencyMonths: '1' })).toContain('every 1 month ');
    expect(periodic.acknowledgmentText({ reviewFrequencyMonths: '6' })).toContain('every 6 months');
    expect(periodic.acknowledgmentText({})).toContain('[frequency not specified]');

    const tie = QUESTION_CONFIG[FIELDS.ACKNOWLEDGE_TIE_RESOLUTION];
    expect(tie.acknowledgmentText({ tieResolution: 'Mediation' })).toContain(
      'resolved by Mediation.',
    );
  });
});
