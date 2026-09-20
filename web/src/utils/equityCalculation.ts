/**
 * Equity calculation for the standalone calculator page (EquityCalculatorPage).
 */

/** One spreadsheet cell: a label in the header row / category column, a number elsewhere. */
interface EquityCell {
  value?: string | number | null;
  readOnly?: boolean;
  className?: string;
}

/** Rows of cells as react-spreadsheet holds them; a missing cell reads as 0. */
export type EquitySheet = readonly (readonly (EquityCell | undefined)[])[];

/**
 * Calculate equity percentages from spreadsheet data
 *
 * Spreadsheet structure:
 * - Row 0: Header row (Category, Importance, Cofounder1, Cofounder2, ...)
 * - Rows 1+: Category rows
 *   - Column 0: Category name
 *   - Column 1: Importance/Weight (0-100)
 *   - Columns 2+: Cofounder scores (0-100)
 *
 * Calculation:
 * 1. Sum all importance values to get totalImportance
 * 2. For each cofounder, calculate weighted score: sum(importance * score) / totalImportance
 * 3. Convert weighted scores to percentages of total
 *
 * @returns One percentage per cofounder column, or null if the data cannot be scored
 */
export function calculateEquityPercentages(data: EquitySheet | null | undefined): number[] | null {
  if (!data) return null;

  try {
    // Validate data structure (checked on an alias: narrowing a readonly array through
    // Array.isArray would turn `data` into any[])
    const rows: unknown = data;
    if (!Array.isArray(rows) || data.length < 2) return null;

    // Skip header row (index 0)
    // Column 0 = Category name
    // Column 1 = Importance/Weight
    // Columns 2+ = Cofounder scores

    // Calculate total importance (sum of column 1, excluding header)
    let totalImportance = 0;
    for (let i = 1; i < data.length; i++) {
      const importance = toNumber(data[i]?.[1]?.value);
      totalImportance += importance;
    }

    if (totalImportance === 0) return null;

    // Calculate weighted scores for each cofounder
    const numCofounders = (data[0]?.length ?? 0) - 2; // Subtract Category and Importance columns
    const weightedScores: number[] = [];

    for (let cofounderIndex = 0; cofounderIndex < numCofounders; cofounderIndex++) {
      const colIndex = cofounderIndex + 2; // Start after Category and Importance
      let weightedScore = 0;

      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const importance = toNumber(data[rowIndex]?.[1]?.value);
        const score = toNumber(data[rowIndex]?.[colIndex]?.value);
        const weight = importance / totalImportance;
        weightedScore += score * weight;
      }

      weightedScores.push(weightedScore);
    }

    // Calculate total of all weighted scores
    const totalScore = weightedScores.reduce((sum, score) => sum + score, 0);

    if (totalScore === 0) return null;

    // Convert to percentages and round to 3 decimal places
    return weightedScores.map((score) => Math.round((score / totalScore) * 100 * 1000) / 1000);
  } catch (error) {
    console.error('Error calculating equity:', error);
    return null;
  }
}

/** `parseFloat(value) || 0`: blank, non-numeric and missing cells score 0. */
function toNumber(value: EquityCell['value']): number {
  return parseFloat(String(value)) || 0;
}
