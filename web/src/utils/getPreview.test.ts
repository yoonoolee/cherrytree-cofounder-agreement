import { makeSurveyData } from '../test/fixtures/project.ts';
import { getPreview } from './getPreview.ts';

describe('getPreview', () => {
  it('is empty for an unanswered question', () => {
    const formData = makeSurveyData();
    expect(getPreview('companyName', formData)).toBe('');
    expect(getPreview('industries', formData)).toBe('');
    expect(getPreview('acknowledgeForfeiture', formData)).toBe('');
  });

  it('stringifies a scalar answer', () => {
    expect(getPreview('companyName', makeSurveyData({ companyName: 'Acme' }))).toBe('Acme');
    expect(getPreview('cofounderCount', makeSurveyData({ cofounderCount: '3' }))).toBe('3');
  });

  it('joins a multi-select answer with commas', () => {
    const formData = makeSurveyData({ industries: ['Software', 'Hardware'] });
    expect(getPreview('industries', formData)).toBe('Software, Hardware');
  });

  it('shows the typed-in text instead of the literal "Other"', () => {
    const scalar = makeSurveyData({ entityType: 'Other', entityTypeOther: 'Cooperative' });
    expect(getPreview('entityType', scalar, 'entityTypeOther')).toBe('Cooperative');
    expect(getPreview('entityType', scalar)).toBe('Other');

    const array = makeSurveyData({ industries: ['Software', 'Other'], industryOther: 'Space' });
    expect(getPreview('industries', array, 'industryOther')).toBe('Software, Space');
  });

  it('keeps the literal "Other" while its text is still empty', () => {
    const formData = makeSurveyData({ entityType: 'Other', entityTypeOther: '' });
    expect(getPreview('entityType', formData, 'entityTypeOther')).toBe('Other');
  });

  it('summarizes an acknowledgment map by how many have ticked', () => {
    const all = makeSurveyData({ acknowledgeForfeiture: { a: true, b: true } });
    const some = makeSurveyData({ acknowledgeForfeiture: { a: true, b: false } });
    const none = makeSurveyData({ acknowledgeForfeiture: { a: false, b: false } });

    expect(getPreview('acknowledgeForfeiture', all)).toBe('Acknowledged');
    expect(getPreview('acknowledgeForfeiture', some)).toBe('In progress');
    expect(getPreview('acknowledgeForfeiture', none)).toBe('');
  });
});
