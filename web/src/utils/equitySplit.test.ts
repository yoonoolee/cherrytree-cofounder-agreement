import { CATEGORIES, GROUPS, calculateSplit } from './equitySplit.ts';

describe('CATEGORIES', () => {
  it('flattens the groups in order, tagging each category with its group', () => {
    expect(CATEGORIES).toHaveLength(18);
    expect(CATEGORIES[0]).toEqual({ name: 'Cash Invested', group: 'Input' });
    expect(CATEGORIES[4]).toEqual({ name: 'Leadership & Management', group: 'Execution' });
    expect(CATEGORIES[17]).toEqual({ name: 'Idea Origination', group: 'Intangibles' });
    expect(GROUPS.map((g) => g.name)).toEqual(['Input', 'Execution', 'Intangibles']);
  });
});

describe('calculateSplit', () => {
  it('returns null while no category has an importance above 0', () => {
    expect(calculateSplit({}, {}, 2)).toBeNull();
    expect(calculateSplit({ Engineering: 0 }, { 0: { Engineering: 10 } }, 2)).toBeNull();
  });

  it('returns null when nobody has scored the important categories', () => {
    expect(calculateSplit({ Engineering: 5 }, {}, 2)).toBeNull();
    expect(calculateSplit({ Engineering: 5 }, { 0: { Engineering: 0 } }, 2)).toBeNull();
  });

  it('weights each cofounder by importance × score and normalizes to 100', () => {
    const importance = { Engineering: 10, Sales: 5, Product: 0 };
    const scores = {
      0: { Engineering: 8, Sales: 2, Product: 10 },
      1: { Engineering: 2, Sales: 8, Product: 0 },
    };
    // A: 10*8 + 5*2 = 90; B: 10*2 + 5*8 = 60; Product is ignored (importance 0).
    expect(calculateSplit(importance, scores, 2)).toEqual([60, 40]);
  });

  it('treats a missing score as 0 and unknown category names as unimportant', () => {
    const split = calculateSplit(
      { Engineering: 4, 'Not A Category': 10 },
      { 0: { Engineering: 3 }, 1: {} },
      2,
    );
    expect(split).toEqual([100, 0]);
  });

  it('yields one share per cofounder, summing to 100', () => {
    const split = calculateSplit(
      { 'Cash Invested': 3, 'Time Commitment': 7 },
      {
        0: { 'Cash Invested': 10, 'Time Commitment': 1 },
        1: { 'Time Commitment': 5 },
        2: { 'Cash Invested': 2 },
      },
      3,
    )!;
    expect(split).toHaveLength(3);
    expect(split.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    expect(split[0]).toBeCloseTo((37 / 78) * 100);
  });
});
