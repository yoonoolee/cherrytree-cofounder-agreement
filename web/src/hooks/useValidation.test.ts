import { renderHook } from '@testing-library/react';
import { SECTION_IDS, SECTION_ORDER, type Project } from '@cherrytree/shared';

import {
  ADMIN_ID,
  MEMBER_ID,
  acknowledgedBy,
  completeSurveyData,
  makeCollaborator,
  makeProject,
  makeSurveyData,
} from '../test/fixtures/project.ts';
import { useValidation } from './useValidation.ts';

const IDS = [ADMIN_ID, MEMBER_ID];
const project = makeProject();

function validation(formData = completeSurveyData(IDS), proj: Project | null = project) {
  return renderHook(() => useValidation(formData, proj)).result.current;
}

describe('useValidation', () => {
  it('reports every section complete for complete answers and none for a fresh form', () => {
    const complete = validation();
    const fresh = validation(makeSurveyData());
    for (const sectionId of SECTION_ORDER) {
      expect(complete.isSectionCompleted(sectionId)).toBe(true);
      expect(fresh.isSectionCompleted(sectionId)).toBe(false);
    }
  });

  it('is false for an unknown section', () => {
    expect(validation().isSectionCompleted('nope')).toBe(false);
  });

  it('derives progress from the same answers and collaborators', () => {
    expect(validation().calculateProgress()).toBe(100);
    expect(validation(makeSurveyData()).calculateProgress()).toBe(0);
    expect(validation(completeSurveyData(IDS), null).calculateProgress()).toBeLessThan(100);
  });

  it('requires the typed-in text when "Other" is chosen', () => {
    const { isOtherFieldValid, isOtherArrayFieldValid } = validation();
    expect(isOtherFieldValid('C-Corp', '')).toBe(true);
    expect(isOtherFieldValid('Other', '')).toBe(false);
    expect(isOtherFieldValid('Other', ' Co-op ')).toBe(true);
    expect(isOtherFieldValid('', '')).toBe(false);

    expect(isOtherArrayFieldValid(['Software'], '')).toBe(true);
    expect(isOtherArrayFieldValid(['Other'], '  ')).toBe(false);
    expect(isOtherArrayFieldValid(['Other'], 'Space')).toBe(true);
    expect(isOtherArrayFieldValid([], '')).toBe(false);
    expect(isOtherArrayFieldValid(undefined, '')).toBe(false);
  });

  it('blocks the cofounders section when a cofounder row outlives its collaborator', () => {
    const oneCollaborator = makeProject({
      collaborators: { [ADMIN_ID]: makeCollaborator({ role: 'admin' }) },
    });
    expect(
      validation(completeSurveyData(IDS), oneCollaborator).isSectionCompleted(
        SECTION_IDS.COFOUNDERS,
      ),
    ).toBe(false);
    expect(
      validation(completeSurveyData([ADMIN_ID]), oneCollaborator).isSectionCompleted(
        SECTION_IDS.COFOUNDERS,
      ),
    ).toBe(true);
  });

  it('needs every active collaborator on each acknowledgment', () => {
    const partial = {
      ...completeSurveyData(IDS),
      acknowledgeIPOwnership: acknowledgedBy([ADMIN_ID]),
    };
    expect(validation(partial).isSectionCompleted(SECTION_IDS.IP)).toBe(false);
  });

  it('needs the equity split to total 100 with every row filled', () => {
    const short = {
      ...completeSurveyData(IDS),
      equityEntries: [
        { name: 'A', percentage: '60' },
        { name: 'B', percentage: '30' },
      ],
    };
    const blank = {
      ...completeSurveyData(IDS),
      equityEntries: [
        { name: 'A', percentage: '100' },
        { name: 'B', percentage: '' },
      ],
    };
    expect(validation(short).isSectionCompleted(SECTION_IDS.EQUITY_ALLOCATION)).toBe(false);
    expect(validation(blank).isSectionCompleted(SECTION_IDS.EQUITY_ALLOCATION)).toBe(false);
  });

  it('only asks for the shotgun acknowledgment when the clause is included', () => {
    const declined = {
      ...completeSurveyData(IDS),
      includeShotgunClause: 'No',
      acknowledgeShotgunClause: {},
    };
    const missing = { ...completeSurveyData(IDS), acknowledgeShotgunClause: {} };
    expect(validation(declined).isSectionCompleted(SECTION_IDS.DECISION_MAKING)).toBe(true);
    expect(validation(missing).isSectionCompleted(SECTION_IDS.DECISION_MAKING)).toBe(false);
  });
});
