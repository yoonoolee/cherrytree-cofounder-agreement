import React, { useState, useEffect, useMemo, useRef } from 'react';
import Spreadsheet from 'react-spreadsheet';
import './EquityCalculator.css';

function EquityCalculator({ cofounders, cofounderData, userDraftData, onDraftChange, onSubmit, isReadOnly, hasSubmitted, submissionError, lastSubmittedAt }) {
  // Function to get cofounder name from email
  const getCofounderName = (email) => {
    // Find index of this collaborator
    const index = cofounders.indexOf(email);
    // Get cofounder at that index
    const cofounder = cofounderData?.[index];
    // Return name if it exists and is not empty, otherwise return fallback
    return (cofounder?.fullName && cofounder.fullName.trim() !== '')
      ? cofounder.fullName
      : `Cofounder ${String.fromCharCode(65 + index)}`;
  };

  // Memoize cofounder names to detect actual changes
  const cofounderNames = useMemo(() => {
    return cofounders.map(email => getCofounderName(email)).join('|');
  }, [cofounders, cofounderData]);

  // Helper function to convert nested arrays to Firebase-compatible object structure
  const convertToFirebaseFormat = (data) => {
    // Convert array of arrays to object with row keys
    const firebaseData = {};
    data.forEach((row, rowIndex) => {
      firebaseData[`row_${rowIndex}`] = {};
      row.forEach((cell, colIndex) => {
        const cellValue = cell.value;
        // For group header cells, preserve null/empty values instead of converting to 0
        const isGroupHeader = cell.className === 'group-header-cell';
        firebaseData[`row_${rowIndex}`][`col_${colIndex}`] = {
          value: isGroupHeader
            ? (cellValue || null)
            : ((cellValue !== undefined && cellValue !== null && cellValue !== '') ? cellValue : 0),
          readOnly: cell.readOnly || false,
          className: cell.className || ''
        };
      });
    });
    return firebaseData;
  };

  // Helper function to convert Firebase object structure back to nested arrays
  const convertFromFirebaseFormat = (firebaseData) => {
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
          // For group header cells, preserve null/empty values instead of converting to 0
          const isGroupHeader = cell?.className === 'group-header-cell';
          return {
            value: isGroupHeader
              ? (cellValue || null)
              : ((cellValue !== undefined && cellValue !== null && cellValue !== '') ? cellValue : 0),
            readOnly: cell?.readOnly || false,
            className: cell?.className || ''
          };
        });
      });
    } catch (error) {
      console.error('Error converting from Firebase format:', error);
      return null;
    }
  };

  // Initialize spreadsheet data with columns as cofounders
  const initializeData = () => {
    // If user has draft data, convert it from Firebase format
    if (userDraftData) {
      // Check if it's in Firebase object format (has row_ keys)
      if (typeof userDraftData === 'object' && !Array.isArray(userDraftData) && Object.keys(userDraftData).some(key => key.startsWith('row_'))) {
        const converted = convertFromFirebaseFormat(userDraftData);
        if (converted && converted.length > 0) {
          return converted;
        }
      }
      // Legacy support: if it's already an array, use it directly but clean it
      if (Array.isArray(userDraftData) && userDraftData.length > 0) {
        // Clean the legacy data to ensure proper structure
        return userDraftData.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            // Header row (rowIndex 0) - all cells read-only
            if (rowIndex === 0) {
              return { ...cell, readOnly: true, className: 'header-cell' };
            }
            // Category column (colIndex 0) - read-only
            if (colIndex === 0) {
              return { ...cell, readOnly: true, className: 'category-cell' };
            }
            // All other cells should be editable
            return {
              value: (cell?.value !== undefined && cell?.value !== null && cell?.value !== '') ? cell.value : 0,
              readOnly: false,
              className: cell?.className || ''
            };
          })
        );
      }
    }

    // Otherwise create fresh data
    const numCofounders = cofounders.length || 2;

    // Organized by groups
    const categoryGroups = [
      {
        group: 'Inputs',
        categories: [
          'Cash Invested',
          'Time Commitment',
          'Existing Work & IP',
          'Equipment & Tools'
        ]
      },
      {
        group: 'Execution',
        categories: [
          'Leadership & Management',
          'Engineering',
          'Sales',
          'Product',
          'Fundraising',
          'Recruiting',
          'Operations'
        ]
      },
      {
        group: 'Intangible',
        categories: [
          'Domain Expertise',
          'Network Value',
          'Irreplaceability',
          'Role Scalability',
          'Opportunity Cost',
          'Risk Tolerance',
          'Idea Origination'
        ]
      }
    ];

    // Header row with cofounder names (all read-only)
    const headerRow = [
      { value: 'Category', readOnly: true, className: 'header-cell' },
      { value: 'Importance', readOnly: true, className: 'header-cell' },
      ...cofounders.map((email) => ({
        value: getCofounderName(email),
        readOnly: true,
        className: 'header-cell'
      }))
    ];

    // Factor rows with group headers
    const factorRows = [];
    categoryGroups.forEach(({ group, categories }) => {
      // Add group header row
      factorRows.push([
        { value: group, readOnly: true, className: 'group-header-cell' },
        { value: null, readOnly: true, className: 'group-header-cell' },
        ...Array.from({ length: numCofounders }, () => ({ value: null, readOnly: true, className: 'group-header-cell' }))
      ]);

      // Add category rows
      categories.forEach((category) => {
        factorRows.push([
          { value: category, readOnly: true, className: 'category-cell' },
          { value: 0 },
          ...Array.from({ length: numCofounders }, () => ({ value: 0 }))
        ]);
      });
    });

    return [headerRow, ...factorRows];
  };

  const [data, setData] = useState(initializeData());
  const prevCofounderNamesRef = useRef(cofounderNames);
  const spreadsheetRef = useRef(null);

  // Calculate equity percentages from current data
  const calculateCurrentEquity = () => {
    try {
      // Skip header row (index 0) and group header rows
      // Column 0 = Category name (or group name for header rows)
      // Column 1 = Importance/Weight
      // Columns 2+ = Cofounder scores

      // Calculate total importance (sum of column 1, excluding header and group headers)
      let totalImportance = 0;
      for (let i = 1; i < data.length; i++) {
        // Skip group header rows (they have className 'group-header-cell')
        if (data[i][0]?.className === 'group-header-cell') continue;

        const importance = parseFloat(data[i][1]?.value) || 0;
        totalImportance += importance;
      }

      if (totalImportance === 0) return null;

      // Calculate weighted scores for each cofounder
      const cofounderScores = {};
      const numCofounders = data[0].length - 2;

      for (let cofounderIndex = 0; cofounderIndex < numCofounders; cofounderIndex++) {
        const colIndex = cofounderIndex + 2;
        let weightedScore = 0;

        for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
          // Skip group header rows
          if (data[rowIndex][0]?.className === 'group-header-cell') continue;

          const importance = parseFloat(data[rowIndex][1]?.value) || 0;
          const score = parseFloat(data[rowIndex][colIndex]?.value) || 0;
          const weight = importance / totalImportance;
          weightedScore += score * weight;
        }

        if (cofounderIndex < cofounders.length) {
          cofounderScores[cofounders[cofounderIndex]] = weightedScore;
        }
      }

      // Calculate total of all weighted scores
      const totalScore = Object.values(cofounderScores).reduce((sum, score) => sum + score, 0);

      if (totalScore === 0) return null;

      // Convert to percentages and round to 3 decimal places
      const equityPercentages = {};
      Object.keys(cofounderScores).forEach(email => {
        const percentage = (cofounderScores[email] / totalScore) * 100;
        equityPercentages[email] = Math.round(percentage * 1000) / 1000;
      });

      return equityPercentages;
    } catch (error) {
      console.error('Error calculating current equity:', error);
      return null;
    }
  };

  const currentEquity = calculateCurrentEquity();

  // Stacked progress bar component
  const EquityProgressBar = ({ equity }) => {
    if (!equity) {
      return (
        <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
          Enter importance values and scores to see equity distribution
        </div>
      );
    }

    // Modern blue gradient palette - light to dark
    const colors = [
      { bg: '#BFDBFE', name: 'Sky' },         // Light sky blue
      { bg: '#93C5FD', name: 'Soft Blue' },   // Soft blue
      { bg: '#60A5FA', name: 'Medium Blue' }, // Medium blue
      { bg: '#3B82F6', name: 'Blue' },        // Bright blue
      { bg: '#2563EB', name: 'Royal' },       // Royal blue
      { bg: '#1E40AF', name: 'Deep Blue' },   // Deep blue
      { bg: '#1E3A8A', name: 'Navy' },        // Navy blue
      { bg: '#172554', name: 'Midnight' }     // Midnight blue
    ];

    const entries = Object.entries(equity);

    return (
      <div className="w-full max-w-3xl mx-auto">
        {/* Stacked Progress Bar */}
        <div className="w-full h-7 bg-gray-200 rounded-lg flex relative" style={{ overflow: 'visible' }}>
          {entries.map(([email, percentage], index) => {
            if (percentage === 0) return null;

            const color = colors[index % colors.length];
            const isFirst = index === 0;
            const isLast = index === entries.length - 1;
            const borderRadiusClass = isFirst ? 'rounded-l-lg' : isLast ? 'rounded-r-lg' : '';

            return (
              <div
                key={email}
                className={`transition-all duration-300 flex items-center justify-center relative ${borderRadiusClass}`}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color.bg,
                  overflow: 'visible'
                }}
              >
                <span
                  className="font-semibold whitespace-nowrap"
                  style={{
                    fontSize: percentage >= 10 ? '0.75rem' : '0.5rem',
                    paddingLeft: percentage >= 10 ? '0.25rem' : '0.125rem',
                    paddingRight: percentage >= 10 ? '0.25rem' : '0.125rem',
                    color: index < 3 ? '#1F2937' : '#FFFFFF',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  {percentage.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 justify-center">
          {entries.map(([email, percentage], index) => {
            const color = colors[index % colors.length];

            return (
              <div key={email} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color.bg }}
                />
                <span className="text-sm text-gray-700">
                  {getCofounderName(email)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Update header row when cofounder names actually change
  useEffect(() => {
    // Only update if cofounder names actually changed
    if (prevCofounderNamesRef.current === cofounderNames) {
      return;
    }

    prevCofounderNamesRef.current = cofounderNames;

    setData(prevData => {
      const newData = [...prevData];
      if (newData[0]) {
        newData[0] = [
          { value: 'Category', readOnly: true, className: 'header-cell' },
          { value: 'Importance', readOnly: true, className: 'header-cell' },
          ...cofounders.map((email) => ({
            value: getCofounderName(email),
            readOnly: true,
            className: 'header-cell'
          }))
        ];
      }
      // Update category column to be read-only
      for (let i = 1; i < newData.length; i++) {
        if (newData[i] && newData[i][0]) {
          // Preserve group-header-cell or category-cell class
          const cellClass = newData[i][0].className || 'category-cell';
          newData[i][0] = { ...newData[i][0], readOnly: true, className: cellClass };
        }
      }
      return newData;
    });
  }, [cofounderNames]);

  // Make single click behave like double click
  useEffect(() => {
    const handleClick = (e) => {
      const cell = e.target.closest('.Spreadsheet__cell');
      if (cell && !cell.classList.contains('Spreadsheet__cell--readonly')) {
        // Prevent default single click behavior
        e.preventDefault();
        e.stopPropagation();

        // Create and dispatch double-click event
        const dblClickEvent = new MouseEvent('dblclick', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY
        });
        cell.dispatchEvent(dblClickEvent);
      }
    };

    const wrapper = spreadsheetRef.current;
    if (wrapper) {
      wrapper.addEventListener('click', handleClick, true);
    }

    return () => {
      if (wrapper) {
        wrapper.removeEventListener('click', handleClick, true);
      }
    };
  }, []);

  // Reset to fresh data with all 18 categories
  const handleReset = () => {
    const numCofounders = cofounders.length || 2;

    // Organized by groups
    const categoryGroups = [
      {
        group: 'Inputs',
        categories: [
          'Cash Invested',
          'Time Commitment',
          'Existing Work & IP',
          'Equipment & Tools'
        ]
      },
      {
        group: 'Execution',
        categories: [
          'Leadership & Management',
          'Engineering',
          'Sales',
          'Product',
          'Fundraising',
          'Recruiting',
          'Operations'
        ]
      },
      {
        group: 'Intangible',
        categories: [
          'Domain Expertise',
          'Network Value',
          'Irreplaceability',
          'Role Scalability',
          'Opportunity Cost',
          'Risk Tolerance',
          'Idea Origination'
        ]
      }
    ];

    // Header row with cofounder names (all read-only)
    const headerRow = [
      { value: 'Category', readOnly: true, className: 'header-cell' },
      { value: 'Importance', readOnly: true, className: 'header-cell' },
      ...cofounders.map((email) => ({
        value: getCofounderName(email),
        readOnly: true,
        className: 'header-cell'
      }))
    ];

    // Factor rows with group headers
    const factorRows = [];
    categoryGroups.forEach(({ group, categories }) => {
      // Add group header row
      factorRows.push([
        { value: group, readOnly: true, className: 'group-header-cell' },
        { value: null, readOnly: true, className: 'group-header-cell' },
        ...Array.from({ length: numCofounders }, () => ({ value: null, readOnly: true, className: 'group-header-cell' }))
      ]);

      // Add category rows
      categories.forEach((category) => {
        factorRows.push([
          { value: category, readOnly: true, className: 'category-cell' },
          { value: 0 },
          ...Array.from({ length: numCofounders }, () => ({ value: 0 }))
        ]);
      });
    });

    const resetData = [headerRow, ...factorRows];
    setData(resetData);

    // Convert to Firebase-compatible format before calling onDraftChange
    if (onDraftChange) {
      const firebaseData = convertToFirebaseFormat(resetData);
      onDraftChange(firebaseData);
    }
  };

  // Just update data when changed (no calculations)
  const handleChange = (newData) => {
    // Preserve read-only properties and classNames, and validate values
    const preservedData = newData.map((row, rowIndex) => {
      return row.map((cell, colIndex) => {
        // Header row (rowIndex 0) - all cells read-only with header-cell class
        if (rowIndex === 0) {
          return { ...cell, readOnly: true, className: 'header-cell' };
        }

        // Category column (colIndex 0) - all cells read-only (preserve group-header-cell or category-cell)
        if (colIndex === 0) {
          const cellClass = data[rowIndex]?.[colIndex]?.className || 'category-cell';
          return { ...cell, readOnly: true, className: cellClass };
        }

        // Group header rows - all cells read-only
        if (data[rowIndex]?.[0]?.className === 'group-header-cell') {
          return { ...cell, readOnly: true, className: 'group-header-cell' };
        }

        // All other cells are editable - validate to integers 0-100
        const value = cell.value;
        const oldValue = data[rowIndex]?.[colIndex]?.value || 0;

        // Convert empty string, null, or undefined to 0
        if (value === '' || value === null || value === undefined) {
          return { ...cell, value: 0 };
        }

        // Convert to string to check format
        const valueStr = String(value);

        // Check if it contains a decimal point - reject decimals, keep old value
        if (valueStr.includes('.')) {
          return { ...cell, value: oldValue };
        }

        // Parse as integer
        const numValue = parseInt(value, 10);

        // Check if it's a valid integer in range 0-100
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
          return { ...cell, value: numValue };
        }

        // If invalid or out of range, keep the old value
        return { ...cell, value: oldValue };
      });
    });
    setData(preservedData);

    // Convert to Firebase-compatible format before calling onDraftChange
    if (onDraftChange) {
      const firebaseData = convertToFirebaseFormat(preservedData);
      onDraftChange(firebaseData);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <h4 className="text-base font-semibold text-gray-900 mb-3">Private Assessment</h4>

        {/* Spreadsheet */}
        <div
          ref={spreadsheetRef}
          className="spreadsheet-wrapper single-click-edit"
          style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'auto' }}
        >
          <Spreadsheet
            data={data}
            onChange={handleChange}
            columnLabels={false}
            rowLabels={false}
          />
        </div>

        {/* Equity Progress Bar */}
        <div className="flex justify-center mt-8 mb-6">
          <EquityProgressBar equity={currentEquity} />
        </div>
      </div>

      {/* Action Bar - fixed at bottom */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 flex-shrink-0" style={{ minHeight: '60px' }}>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
        >
          Reset Spreadsheet
        </button>

        <div className="flex flex-col items-end">
          <button
            onClick={onSubmit}
            disabled={isReadOnly}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {hasSubmitted ? 'Update Assessment' : 'Share My Assessment'}
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {submissionError && (
            <p className="text-sm text-red-600 mt-2">
              {submissionError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EquityCalculator;
