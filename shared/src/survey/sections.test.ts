import {
  SECTION_IDS,
  SECTION_ORDER,
  getNextSection,
  isLastSection,
  isSectionId,
} from './sections.ts';

describe('isSectionId', () => {
  it('accepts every section id', () => {
    for (const id of SECTION_ORDER) expect(isSectionId(id)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isSectionId('generated-agreement')).toBe(false);
    expect(isSectionId('')).toBe(false);
    expect(isSectionId(null)).toBe(false);
    expect(isSectionId(undefined)).toBe(false);
    expect(isSectionId(0)).toBe(false);
  });
});

describe('getNextSection / isLastSection', () => {
  it('walks the order and stops after the last section', () => {
    expect(getNextSection(SECTION_IDS.FORMATION)).toBe(SECTION_IDS.COFOUNDERS);
    expect(getNextSection(SECTION_IDS.GENERAL_PROVISIONS)).toBeNull();
    expect(isLastSection(SECTION_IDS.GENERAL_PROVISIONS)).toBe(true);
    expect(isLastSection(SECTION_IDS.FORMATION)).toBe(false);
  });

  it('starts over from an unknown id', () => {
    expect(getNextSection('nope')).toBe(SECTION_IDS.FORMATION);
    expect(isLastSection('nope')).toBe(false);
  });
});
