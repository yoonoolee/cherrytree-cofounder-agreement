import { calculateEquityPercentages } from './equityCalculation.ts';

const cell = (value: string | number | null) => ({ value });

const header = [cell('Category'), cell('Importance'), cell('A'), cell('B')];

/** Header + two categories, two cofounders. Equal importance → A 60 / B 40. */
const sheet = [
  header,
  [cell('Idea'), cell(50), cell(80), cell(20)],
  [cell('Execution'), cell('50'), cell('40'), cell('60')],
];

describe('calculateEquityPercentages', () => {
  it('weights each cofounder score by category importance and normalizes to 100', () => {
    expect(calculateEquityPercentages(sheet)).toEqual([60, 40]);
  });

  it('rounds to three decimals', () => {
    const thirds = [
      [cell('Category'), cell('Importance'), cell('A'), cell('B')],
      [cell('X'), cell(1), cell(1), cell(0)],
      [cell('Y'), cell(2), cell(0), cell(1)],
    ];
    expect(calculateEquityPercentages(thirds)).toEqual([33.333, 66.667]);
  });

  it('is null for missing, header-only or weightless data', () => {
    expect(calculateEquityPercentages(null)).toBeNull();
    expect(calculateEquityPercentages(undefined)).toBeNull();
    expect(calculateEquityPercentages([header])).toBeNull();
    expect(
      calculateEquityPercentages([header, [cell('X'), cell(0), cell(10), cell(10)]]),
    ).toBeNull();
    expect(
      calculateEquityPercentages([header, [cell('X'), cell(10), cell(0), cell(0)]]),
    ).toBeNull();
  });

  it('treats blank, non-numeric and missing cells as 0', () => {
    const sparse = [
      [cell('Category'), cell('Importance'), cell('A'), cell('B')],
      [cell('X'), cell(10), cell(''), cell('n/a')],
      [cell('Y'), cell(10), cell(5)],
    ];
    expect(calculateEquityPercentages(sparse)).toEqual([100, 0]);
  });
});
