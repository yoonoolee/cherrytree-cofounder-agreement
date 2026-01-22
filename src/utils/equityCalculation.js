/**
 * Shared equity calculation utilities
 * Used by SectionEquityAllocation, EquityCalculator, and EquityCalculatorPage
 */

/**
 * Convert Firebase object structure to nested array format
 * @param {Object} firebaseData - Data in Firebase format (row_0: { col_0: {...}, col_1: {...} })
 * @returns {Array|null} - Array of arrays with cell objects, or null if invalid
 */
export function convertFromFirebaseFormat(firebaseData) {
  if (!firebaseData) return null;

  try {
    // Extract row keys and sort them
    const rowKeys = Object.keys(firebaseData).sort((a, b) => {
      const aNum = parseInt(a.split('_')[1]);
      const bNum = parseInt(b.split('_')[1]);
      return aNum - bNum;
    });

    return rowKeys.map(rowKey => {
      const row = firebaseData[rowKey];
      if (!row) return [];

      const colKeys = Object.keys(row).sort((a, b) => {
        const aNum = parseInt(a.split('_')[1]);
        const bNum = parseInt(b.split('_')[1]);
        return aNum - bNum;
      });

      return colKeys.map(colKey => {
        const cell = row[colKey];
        const cellValue = cell?.value;
        return {
          value: (cellValue !== undefined && cellValue !== null && cellValue !== '') ? cellValue : 0,
          readOnly: cell?.readOnly || false,
          className: cell?.className || ''
        };
      });
    });
  } catch (error) {
    console.error('Error converting from Firebase format:', error);
    return null;
  }
}

/**
 * Check if data is in Firebase format (object with row_N keys)
 * @param {*} data - Data to check
 * @returns {boolean}
 */
export function isFirebaseFormat(data) {
  return (
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Object.keys(data).some(key => key.startsWith('row_'))
  );
}

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
 * @param {Array|Object} spreadsheetData - Spreadsheet data (array format or Firebase format)
 * @param {Object} options - Options
 * @param {Array} [options.collaboratorIds] - Array of user IDs to map results to (optional)
 * @returns {Object|Array|null} - If collaboratorIds provided: { userId: percentage }
 *                                If not provided: [percentage, percentage, ...]
 *                                Returns null if data is invalid
 */
export function calculateEquityPercentages(spreadsheetData, options = {}) {
  const { collaboratorIds } = options;

  if (!spreadsheetData) return null;

  try {
    // Convert Firebase format to array if needed
    let data = spreadsheetData;
    if (isFirebaseFormat(spreadsheetData)) {
      data = convertFromFirebaseFormat(spreadsheetData);
      if (!data) return null;
    }

    // Validate data structure
    if (!Array.isArray(data) || data.length < 2) return null;

    // Skip header row (index 0)
    // Column 0 = Category name
    // Column 1 = Importance/Weight
    // Columns 2+ = Cofounder scores

    // Calculate total importance (sum of column 1, excluding header)
    let totalImportance = 0;
    for (let i = 1; i < data.length; i++) {
      const importance = parseFloat(data[i][1]?.value) || 0;
      totalImportance += importance;
    }

    if (totalImportance === 0) return null;

    // Calculate weighted scores for each cofounder
    const numCofounders = data[0].length - 2; // Subtract Category and Importance columns
    const weightedScores = [];

    for (let cofounderIndex = 0; cofounderIndex < numCofounders; cofounderIndex++) {
      const colIndex = cofounderIndex + 2; // Start after Category and Importance
      let weightedScore = 0;

      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const importance = parseFloat(data[rowIndex][1]?.value) || 0;
        const score = parseFloat(data[rowIndex][colIndex]?.value) || 0;
        const weight = importance / totalImportance;
        weightedScore += score * weight;
      }

      weightedScores.push(weightedScore);
    }

    // Calculate total of all weighted scores
    const totalScore = weightedScores.reduce((sum, score) => sum + score, 0);

    if (totalScore === 0) return null;

    // Convert to percentages and round to 3 decimal places
    const percentages = weightedScores.map(score =>
      Math.round((score / totalScore) * 100 * 1000) / 1000
    );

    // Return as object with userIds if provided, otherwise as array
    if (collaboratorIds && Array.isArray(collaboratorIds)) {
      const result = {};
      collaboratorIds.forEach((userId, index) => {
        if (index < percentages.length) {
          result[userId] = percentages[index];
        }
      });
      return result;
    }

    return percentages;
  } catch (error) {
    console.error('Error calculating equity:', error);
    return null;
  }
}
