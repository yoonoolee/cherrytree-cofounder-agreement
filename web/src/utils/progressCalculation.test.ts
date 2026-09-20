import {
  ADMIN_ID,
  MEMBER_ID,
  acknowledgedBy,
  completeSurveyData,
  makeCollaborator,
  makeProject,
  makeSurveyData,
} from '../test/fixtures/project.ts';
import { calculateProjectProgress, countCompletedSections } from './progressCalculation.ts';

const IDS = [ADMIN_ID, MEMBER_ID];

describe('calculateProjectProgress', () => {
  it('is 0 for a fresh project and 100 for a complete one', () => {
    expect(calculateProjectProgress(makeProject())).toBe(0);
    expect(calculateProjectProgress(makeProject({ surveyData: completeSurveyData(IDS) }))).toBe(
      100,
    );
  });

  it('tolerates a project without survey data or collaborators', () => {
    expect(
      calculateProjectProgress({ surveyData: undefined, collaborators: undefined } as never),
    ).toBe(0);
  });

  // 42 required answers for a project with no cofounder rows, no equity rows and no shotgun
  // clause; one answered → 2%.
  it('counts one answered field against the required total', () => {
    const project = makeProject({ surveyData: makeSurveyData({ companyName: 'Acme' }) });
    expect(calculateProjectProgress(project)).toBe(2);
  });

  it('requires the typed-in text when "Other" is chosen', () => {
    const chosen = makeProject({ surveyData: makeSurveyData({ entityType: 'Other' }) });
    const filled = makeProject({
      surveyData: makeSurveyData({ entityType: 'Other', entityTypeOther: 'Co-op' }),
    });
    expect(calculateProjectProgress(chosen)).toBe(0);
    expect(calculateProjectProgress(filled)).toBe(2);
  });

  it('only counts an acknowledgment when every active collaborator has ticked it', () => {
    const partial = makeProject({
      surveyData: makeSurveyData({ acknowledgeForfeiture: acknowledgedBy([ADMIN_ID]) }),
    });
    const all = makeProject({
      surveyData: makeSurveyData({ acknowledgeForfeiture: acknowledgedBy(IDS) }),
    });
    expect(calculateProjectProgress(partial)).toBe(0);
    expect(calculateProjectProgress(all)).toBe(2);
  });

  it('ignores removed collaborators when checking acknowledgments', () => {
    const project = makeProject({
      collaborators: {
        [ADMIN_ID]: makeCollaborator({ role: 'admin' }),
        user_gone: makeCollaborator({ isActive: false }),
      },
      surveyData: makeSurveyData({ acknowledgeForfeiture: acknowledgedBy([ADMIN_ID]) }),
    });
    expect(calculateProjectProgress(project)).toBe(2);
  });

  it('adds the shotgun acknowledgment only when the clause is included', () => {
    const withClause = makeProject({
      surveyData: completeSurveyData(IDS),
    });
    const withoutAck = makeProject({
      surveyData: { ...completeSurveyData(IDS), acknowledgeShotgunClause: {} },
    });
    const noClause = makeProject({
      surveyData: {
        ...completeSurveyData(IDS),
        includeShotgunClause: 'No',
        acknowledgeShotgunClause: {},
      },
    });
    expect(calculateProjectProgress(withClause)).toBe(100);
    expect(calculateProjectProgress(withoutAck)).toBeLessThan(100);
    expect(calculateProjectProgress(noClause)).toBe(100);
  });

  it('requires the equity split to add up to 100', () => {
    const project = makeProject({
      surveyData: {
        ...completeSurveyData(IDS),
        equityEntries: [
          { name: 'A', percentage: '60' },
          { name: 'B', percentage: '50' },
        ],
      },
    });
    expect(calculateProjectProgress(project)).toBeLessThan(100);
  });
});

describe('countCompletedSections', () => {
  it('is 0 for a fresh project and 10 for a complete one', () => {
    expect(countCompletedSections(makeProject())).toBe(0);
    expect(countCompletedSections(makeProject({ surveyData: completeSurveyData(IDS) }))).toBe(10);
    expect(countCompletedSections(undefined)).toBe(0);
  });

  it('drops a section as soon as one of its answers is missing', () => {
    const project = makeProject({
      surveyData: { ...completeSurveyData(IDS), governingLaw: '' },
    });
    expect(countCompletedSections(project)).toBe(9);
  });

  it('blocks the cofounders section when there are more rows than active collaborators', () => {
    const project = makeProject({
      collaborators: { [ADMIN_ID]: makeCollaborator({ role: 'admin' }) },
      surveyData: completeSurveyData(IDS),
    });
    // Two cofounder rows for one collaborator; every acknowledgment still holds for the admin.
    expect(countCompletedSections(project)).toBe(9);
  });

  it('accepts the decision-making section without a shotgun acknowledgment when declined', () => {
    const project = makeProject({
      surveyData: {
        ...completeSurveyData(IDS),
        includeShotgunClause: 'No',
        acknowledgeShotgunClause: {},
      },
    });
    expect(countCompletedSections(project)).toBe(10);
  });
});
