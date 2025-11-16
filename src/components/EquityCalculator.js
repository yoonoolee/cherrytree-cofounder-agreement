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
    // Return first name if it exists, otherwise return fallback
    if (cofounder?.fullName && cofounder.fullName.trim() !== '') {
      const firstName = cofounder.fullName.trim().split(' ')[0];
      return firstName;
    }
    return `Cofounder ${String.fromCharCode(65 + index)}`;
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
        firebaseData[`row_${rowIndex}`][`col_${colIndex}`] = {
          value: (cellValue !== undefined && cellValue !== null && cellValue !== '') ? cellValue : 0,
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
  };

  // Initialize spreadsheet data - 22 rows (header + 21 categories, no group headers)
  const initializeData = () => {
    const numCofounders = cofounders.length || 2;

    // All 22 rows with their exact labels (no group headers)
    const rows = [
      'Category',      // Row 1 - header
      'Input',
      'Cash Invested',
      'Time Commitment',
      'Existing Work & IP',
      'Equipment & Tools',
      'Execution',
      'Leadership & Management',
      'Engineering',
      'Sales',
      'Product',
      'Fundraising',
      'Recruiting',
      'Operations',
      'Intangibles',
      'Domain Expertise',
      'Network Value',
      'Irreplaceability',
      'Role Scalability',
      'Opportunity Cost',
      'Risk Tolerance',
      'Idea Origination'
    ];

    const data = rows.map((rowLabel, index) => {
      // Row 1 - Header row
      if (index === 0) {
        return [
          { value: 'Category', readOnly: true, className: 'header-cell' },
          { value: 'Importance', readOnly: true, className: 'header-cell' },
          ...cofounders.map((email) => ({
            value: getCofounderName(email),
            readOnly: true,
            className: 'header-cell'
          }))
        ];
      }

      // Special read-only rows with no values
      if (rowLabel === 'Input' || rowLabel === 'Execution' || rowLabel === 'Intangibles') {
        return [
          { value: rowLabel, readOnly: true, className: 'category-cell separator-cell' },
          { value: '', readOnly: true, className: 'separator-cell' },
          ...Array.from({ length: numCofounders }, () => ({ value: '', readOnly: true, className: 'separator-cell' }))
        ];
      }

      // All other rows - regular category rows
      return [
        { value: rowLabel, readOnly: true, className: 'category-cell' },
        { value: 0 },
        ...Array.from({ length: numCofounders }, () => ({ value: 0 }))
      ];
    });

    // Merge in saved data if it exists
    if (userDraftData) {
      let loadedData = null;
      if (typeof userDraftData === 'object' && !Array.isArray(userDraftData) && Object.keys(userDraftData).some(key => key.startsWith('row_'))) {
        loadedData = convertFromFirebaseFormat(userDraftData);
      } else if (Array.isArray(userDraftData)) {
        loadedData = userDraftData;
      }

      if (loadedData) {
        // Match by category name and merge values
        for (let i = 1; i < data.length; i++) {
          const categoryName = data[i][0]?.value;
          if (!categoryName) continue;

          // Skip merging data for special read-only rows
          if (categoryName === 'Input' || categoryName === 'Execution' || categoryName === 'Intangibles') {
            continue;
          }

          const savedRow = loadedData.find(row => row[0]?.value === categoryName);
          if (savedRow) {
            for (let j = 1; j < data[i].length && j < savedRow.length; j++) {
              const savedValue = savedRow[j]?.value;
              if (savedValue !== undefined && savedValue !== null && savedValue !== '') {
                data[i][j] = { ...data[i][j], value: savedValue };
              }
            }
          }
        }
      }
    }

    return data;
  };

  const [data, setData] = useState(initializeData());
  const prevCofounderNamesRef = useRef(cofounderNames);
  const spreadsheetRef = useRef(null);

  // Calculate equity percentages from current data
  const calculateCurrentEquity = () => {
    try {
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
      const cofounderScores = {};
      const numCofounders = data[0].length - 2;

      for (let cofounderIndex = 0; cofounderIndex < numCofounders; cofounderIndex++) {
        const colIndex = cofounderIndex + 2;
        let weightedScore = 0;

        for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
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

    const entries = Object.entries(equity);

    // Generate greyscale colors evenly spaced from black to white
    const numCofounders = entries.length;
    const colors = Array.from({ length: numCofounders }, (_, i) => {
      const value = numCofounders === 1 ? 0 : Math.round((i * 255) / (numCofounders - 1));
      const hex = value.toString(16).padStart(2, '0');
      return { bg: `#${hex}${hex}${hex}` };
    });

    return (
      <div className="w-full max-w-3xl mx-auto">
        {/* Stacked Progress Bar */}
        <div className="w-full h-7 bg-gray-200 rounded-lg flex relative" style={{ overflow: 'visible', border: '1px solid #000000' }}>
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
                    color: index < Math.ceil(numCofounders / 2) ? '#FFFFFF' : '#000000',
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
                  style={{ backgroundColor: color.bg, border: '1px solid #000000' }}
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

  // Prevent page scroll when scrolling within spreadsheet
  useEffect(() => {
    const handleWheel = (e) => {
      const wrapper = spreadsheetRef.current;
      if (!wrapper) return;

      const { scrollTop, scrollHeight, clientHeight } = wrapper;
      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;

      // Prevent page scroll if we can still scroll within the spreadsheet
      const canScrollUp = scrollTop > 0;
      const canScrollDown = scrollTop < scrollHeight - clientHeight;

      if ((isScrollingUp && canScrollUp) || (isScrollingDown && canScrollDown)) {
        e.stopPropagation();
      }
    };

    const wrapper = spreadsheetRef.current;
    if (wrapper) {
      wrapper.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (wrapper) {
        wrapper.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Just update data when changed (no calculations)
  const handleChange = (newData) => {
    // Preserve read-only properties and classNames, and validate values
    const preservedData = newData.map((row, rowIndex) => {
      return row.map((cell, colIndex) => {
        // Header row (rowIndex 0) - all cells read-only with header-cell class
        if (rowIndex === 0) {
          return { ...cell, readOnly: true, className: 'header-cell' };
        }

        // Get category name for special row checks
        const categoryName = row[0]?.value;
        const isSeparatorRow = categoryName === 'Input' || categoryName === 'Execution' || categoryName === 'Intangibles';

        // Category column (colIndex 0) - all cells read-only with category-cell class
        if (colIndex === 0) {
          return {
            ...cell,
            readOnly: true,
            className: isSeparatorRow ? 'category-cell separator-cell' : 'category-cell'
          };
        }

        // Special read-only rows (Input, Execution, Intangibles) - keep empty and read-only
        if (isSeparatorRow) {
          return { ...cell, value: '', readOnly: true, className: 'separator-cell' };
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
    <div className="flex flex-col">
      {/* Spreadsheet Container - No scrolling */}
      <div className="flex flex-col">
        <div className="spreadsheet-wrapper" style={{ overflow: 'visible' }}>
          <div
            ref={spreadsheetRef}
            className="single-click-edit spreadsheet-scroll-container"
            style={{
              overflowX: 'auto',
              overflowY: 'visible',
              position: 'relative'
            }}
          >
            <Spreadsheet
              data={data}
              onChange={handleChange}
              columnLabels={false}
              rowLabels={false}
            />
          </div>
        </div>

        {/* Equity Progress Bar */}
        <div className="flex justify-center py-6 px-4" style={{ backgroundColor: '#ffffff' }}>
          <EquityProgressBar equity={currentEquity} />
        </div>

        {/* Action Buttons - Below visual bar */}
        {submissionError && (
          <div className="flex items-center justify-end pt-4 flex-shrink-0">
            <p className="text-sm text-red-950">
              {submissionError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EquityCalculator;
