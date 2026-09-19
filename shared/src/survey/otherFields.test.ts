import { mergeOtherFields, OTHER_FIELD_CONFIG } from './otherFields.ts';

describe('OTHER_FIELD_CONFIG', () => {
  it('covers the expected fields', () => {
    expect(OTHER_FIELD_CONFIG.map((c) => `${c.field}→${c.otherField}:${c.type}`)).toEqual([
      'industries→industryOther:array',
      'majorDecisions→majorDecisionsOther:array',
      'terminationWithCause→terminationWithCauseOther:array',
      'cofounders.roles→rolesOther:array',
      'entityType→entityTypeOther:string',
      'vestingSchedule→vestingScheduleOther:string',
      'nonCompeteDuration→nonCompeteDurationOther:string',
      'nonSolicitDuration→nonSolicitDurationOther:string',
      'disputeResolution→disputeResolutionOther:string',
      'amendmentProcess→amendmentProcessOther:string',
    ]);
  });
});

describe('mergeOtherFields', () => {
  it('returns {} for missing data', () => {
    expect(mergeOtherFields(null)).toEqual({});
    expect(mergeOtherFields(undefined)).toEqual({});
  });

  it('replaces "Other" in an array field with the custom text and drops the other field', () => {
    const result = mergeOtherFields({
      industries: ['Fintech', 'Other'],
      industryOther: 'Space',
    });
    expect(result).toEqual({ industries: ['Fintech', 'Space'] });
  });

  it('replaces an "Other" string field with the custom text', () => {
    const result = mergeOtherFields({ entityType: 'Other', entityTypeOther: 'Cooperative' });
    expect(result).toEqual({ entityType: 'Cooperative' });
  });

  it('leaves "Other" in place when the custom text is empty, but still drops the other field', () => {
    const result = mergeOtherFields({
      industries: ['Other'],
      industryOther: '',
      entityType: 'Other',
      entityTypeOther: '',
    });
    expect(result).toEqual({ industries: ['Other'], entityType: 'Other' });
  });

  it('drops every other field even when its selection is absent', () => {
    const result = mergeOtherFields({ industryOther: 'Space', entityTypeOther: 'Cooperative' });
    expect(result).toEqual({});
  });

  it('leaves non-"Other" selections untouched and passes unrelated fields through', () => {
    const result = mergeOtherFields({
      companyName: 'Acme',
      industries: ['Fintech'],
      industryOther: 'ignored',
      entityType: 'LLC',
      entityTypeOther: 'ignored',
    });
    expect(result).toEqual({ companyName: 'Acme', industries: ['Fintech'], entityType: 'LLC' });
  });

  it('merges nested cofounder roles', () => {
    const result = mergeOtherFields({
      cofounders: [
        { id: '1', fullName: 'A', title: '', email: '', roles: ['Other'], rolesOther: 'Chef' },
        { id: '2', fullName: 'B', title: '', email: '', roles: ['Fundraising'], rolesOther: '' },
      ],
    });
    expect(result).toEqual({
      cofounders: [
        { id: '1', fullName: 'A', title: '', email: '', roles: ['Chef'] },
        { id: '2', fullName: 'B', title: '', email: '', roles: ['Fundraising'] },
      ],
    });
  });

  it('does not mutate top-level input fields', () => {
    const input = { industries: ['Other'], industryOther: 'Space' };
    mergeOtherFields(input);
    expect(input).toEqual({ industries: ['Other'], industryOther: 'Space' });
  });

  // Pins existing behavior: the copy is shallow, so nested cofounder objects ARE mutated.
  // Recorded in docs/REFACTOR_PLAN.md; changing it is a product decision, not a refactor.
  it('mutates nested cofounder objects in place (pinned, not a feature)', () => {
    const cofounder = {
      id: '1',
      fullName: 'A',
      title: '',
      email: '',
      roles: ['Other'],
      rolesOther: 'Chef',
    };
    const input = { cofounders: [cofounder] };
    mergeOtherFields(input);
    expect(cofounder).toEqual({ id: '1', fullName: 'A', title: '', email: '', roles: ['Chef'] });
  });
});
