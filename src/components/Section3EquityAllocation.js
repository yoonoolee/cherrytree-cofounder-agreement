import React, { useRef } from 'react';
import EquityCalculator from './EquityCalculator';
import { auth } from '../firebase';
import './Section3EquityAllocation.css';

function Section3EquityAllocation({ formData, handleChange, isReadOnly, showValidation, project }) {
  const visualBarsRef = useRef(null);
  // Calculate number of cofounders from collaborators (owner + collaborators)
  const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
  const currentUserEmail = auth.currentUser?.email;

  // Function to get cofounder name from email
  const getCofounderName = (email) => {
    // Find index of this collaborator
    const index = allCollaborators.indexOf(email);
    // Get cofounder at that index
    const cofounder = formData.cofounders?.[index];
    // Return first name if it exists, otherwise return email
    if (cofounder?.fullName && cofounder.fullName.trim() !== '') {
      const firstName = cofounder.fullName.trim().split(' ')[0];
      return firstName;
    }
    return email;
  };

  // Initialize equity percentages, acknowledgments, and calculator data if not present
  const initializedRef = React.useRef(false);
  const [submissionError, setSubmissionError] = React.useState('');
  const [showIndividualSpreadsheets, setShowIndividualSpreadsheets] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('edit'); // 'edit', 'waiting', 'results'
  const [slideDirection, setSlideDirection] = React.useState(''); // 'exit-left', 'exit-right', 'enter-from-left', 'enter-from-right'
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);

  // Helper function to change view with animation
  const changeView = (newView) => {
    if (isAnimating) return; // Prevent multiple transitions

    // Determine exit direction and enter direction based on view transition
    // edit -> waiting/results = exit left, enter from right
    // waiting/results -> edit = exit right, enter from left
    const goingForward = newView !== 'edit';
    const exitDirection = goingForward ? 'exit-left' : 'exit-right';
    const enterDirection = goingForward ? 'enter-from-right' : 'enter-from-left';

    setSlideDirection(exitDirection);
    setIsAnimating(true);

    // Wait for exit animation, then change view
    setTimeout(() => {
      setViewMode(newView);
      setSlideDirection(enterDirection);
      // Reset animation state after enter animation
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection('');
      }, 300);
    }, 300);
  };

  React.useEffect(() => {
    if (initializedRef.current) return;

    let needsUpdate = false;
    const updates = {};

    if (!formData.finalEquityPercentages) {
      const initialPercentages = {};
      allCollaborators.forEach(email => {
        initialPercentages[email] = '';
      });
      updates.finalEquityPercentages = initialPercentages;
      needsUpdate = true;
    }
    if (!formData.acknowledgeEquityAllocation) {
      updates.acknowledgeEquityAllocation = {};
      needsUpdate = true;
    }
    if (!formData.equityCalculatorDraft) {
      updates.equityCalculatorDraft = {};
      needsUpdate = true;
    }
    if (!formData.equityCalculatorSubmitted) {
      updates.equityCalculatorSubmitted = {};
      needsUpdate = true;
    }

    if (needsUpdate) {
      Object.keys(updates).forEach(key => {
        handleChange(key, updates[key]);
      });
    }

    initializedRef.current = true;
  }, []);

  const handleEquityChange = (email, value) => {
    const newPercentages = {
      ...(formData.finalEquityPercentages || {}),
      [email]: value
    };
    handleChange('finalEquityPercentages', newPercentages);

    // Uncheck all acknowledgments when any equity is changed
    handleChange('acknowledgeEquityAllocation', {});
  };

  const handleAcknowledgmentChange = (email, checked) => {
    const newAcknowledgments = {
      ...(formData.acknowledgeEquityAllocation || {}),
      [email]: checked
    };
    handleChange('acknowledgeEquityAllocation', newAcknowledgments);
  };

  // Handle draft change - save to user's draft
  const handleDraftChange = (draftData) => {
    // Clear any submission errors when user makes changes
    if (submissionError) {
      setSubmissionError('');
    }

    const newDrafts = {
      ...(formData.equityCalculatorDraft || {}),
      [currentUserEmail]: draftData
    };
    handleChange('equityCalculatorDraft', newDrafts);
  };

  // Validate spreadsheet data before submission
  const validateSpreadsheetData = (spreadsheetData) => {
    if (!spreadsheetData) {
      return { valid: false, message: 'No data to submit. Please fill out the equity calculator first.' };
    }

    try {
      // Calculate equity percentages from the spreadsheet
      const equityPercentages = calculateEquityFromSpreadsheet(spreadsheetData);

      // If calculation returns null, it means the data is invalid (all zeros)
      if (!equityPercentages) {
        return { valid: false, message: 'All cofounders must have equity % higher than 0.' };
      }

      // Check that all cofounders have non-zero equity percentages
      const cofoundersWithZeroEquity = [];
      allCollaborators.forEach(email => {
        const percentage = equityPercentages[email] || 0;
        if (percentage === 0) {
          cofoundersWithZeroEquity.push(getCofounderName(email));
        }
      });

      if (cofoundersWithZeroEquity.length > 0) {
        return {
          valid: false,
          message: `All cofounders must have non-zero equity. ${cofoundersWithZeroEquity.join(', ')} ${cofoundersWithZeroEquity.length === 1 ? 'has' : 'have'} 0% equity.`
        };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, message: 'Error validating data. Please check your entries.' };
    }
  };

  // Handle submit - copy draft to submitted
  const handleSubmit = () => {
    const userDraft = formData.equityCalculatorDraft?.[currentUserEmail];

    // Validate the data
    const validation = validateSpreadsheetData(userDraft);
    if (!validation.valid) {
      setSubmissionError(validation.message);
      return;
    }

    // Clear any previous errors
    setSubmissionError('');

    const newSubmitted = {
      ...(formData.equityCalculatorSubmitted || {}),
      [currentUserEmail]: {
        data: userDraft,
        submittedAt: new Date().toISOString()
      }
    };
    handleChange('equityCalculatorSubmitted', newSubmitted);

    // Navigate to results view with animation
    changeView('results');

    // Scroll to visual bars section and center it on the page
    setTimeout(() => {
      if (visualBarsRef.current) {
        visualBarsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Effect to update viewMode when submissions change
  React.useEffect(() => {
    if (hasSubmitted && viewMode === 'edit') {
      changeView('results');
    }
  }, [formData.equityCalculatorSubmitted]);

  // Check if current user has submitted
  const hasSubmitted = !!formData.equityCalculatorSubmitted?.[currentUserEmail];

  const totalEquity = allCollaborators.reduce((sum, email) => {
    return sum + (parseFloat(formData.finalEquityPercentages?.[email]) || 0);
  }, 0);

  // Function to calculate equity percentages from a submitted spreadsheet
  const calculateEquityFromSpreadsheet = (spreadsheetData) => {
    if (!spreadsheetData) return null;

    try {
      // Convert Firebase format to array if needed
      let data = spreadsheetData;
      if (typeof spreadsheetData === 'object' && !Array.isArray(spreadsheetData)) {
        // It's in Firebase format, need to convert
        const rowKeys = Object.keys(spreadsheetData).sort((a, b) => {
          const aNum = parseInt(a.split('_')[1]);
          const bNum = parseInt(b.split('_')[1]);
          return aNum - bNum;
        });

        data = rowKeys.map(rowKey => {
          const row = spreadsheetData[rowKey];
          if (!row) return [];

          const colKeys = Object.keys(row).sort((a, b) => {
            const aNum = parseInt(a.split('_')[1]);
            const bNum = parseInt(b.split('_')[1]);
            return aNum - bNum;
          });

          return colKeys.map(colKey => {
            const cell = row[colKey];
            return {
              value: cell?.value !== undefined ? cell.value : 0
            };
          });
        });
      }

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
      const numCofounders = data[0].length - 2; // Subtract Category and Importance columns

      for (let cofounderIndex = 0; cofounderIndex < numCofounders; cofounderIndex++) {
        const colIndex = cofounderIndex + 2; // Start after Category and Importance
        let weightedScore = 0;

        for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
          // Skip group header rows
          if (data[rowIndex][0]?.className === 'group-header-cell') continue;

          const importance = parseFloat(data[rowIndex][1]?.value) || 0;
          const score = parseFloat(data[rowIndex][colIndex]?.value) || 0;
          const weight = importance / totalImportance;
          weightedScore += score * weight;
        }

        // Map column index to actual cofounder email
        if (cofounderIndex < allCollaborators.length) {
          const cofounderEmail = allCollaborators[cofounderIndex];
          cofounderScores[cofounderEmail] = weightedScore;
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
      console.error('Error calculating equity:', error);
      return null;
    }
  };

  // Check if all cofounders have submitted
  const allSubmitted = allCollaborators.every(email =>
    !!formData.equityCalculatorSubmitted?.[email]
  );

  // Calculate equity for each person's submission
  const equityCalculations = {};
  allCollaborators.forEach(email => {
    const submission = formData.equityCalculatorSubmitted?.[email];
    if (submission?.data) {
      equityCalculations[email] = calculateEquityFromSpreadsheet(submission.data);
    }
  });

  // Ref for scrolling to Final Equity Allocation
  const finalEquityRef = React.useRef(null);

  const scrollToFinalEquity = () => {
    finalEquityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="equity-calculator-container">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Equity Allocation</h2>

      <p className="mb-4 leading-relaxed" style={{ color: '#808894' }}>
        A few years ago, two friends from Stanford launched a startup that took off fast. Within six months, they were in YC, had a long waiting list, and investors were calling.
      </p>
      <p className="mb-4 leading-relaxed" style={{ color: '#808894' }}>
        But one cofounder started feeling like they were doing more. "I'm the CEO, I'm fundraising, I'm working longer hours." They tried to renegotiate the equity split from 50/50 to 70/30. The other cofounder felt blindsided, trust collapsed, and by Demo Day they'd split, both emotionally and legally.
      </p>
      <p className="mb-16 leading-relaxed" style={{ color: '#808894' }}>
        Be very reluctant to change equity allocation once you've agreed. The #1 reason for cofounder breakups in the most recent YC batch was cofounders trying to revisit a settled split.
      </p>

      <div className="space-y-6">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Equity Calculator</h3>
          <p className="text-gray-700 mb-6">
            Using the calculator is optional. Your agreement only includes the final allocation entered below. If you already know your split, skip ahead and add it here.
          </p>
          <div className="mb-6">
            {/* Collapsible Instructions */}
            <div className="border border-gray-200/50 rounded-lg mb-6 bg-gray-50/50 backdrop-blur-sm">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100/50 transition-colors rounded-lg"
              >
                <span className="font-semibold text-gray-900">Instructions</span>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform ${showInstructions ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showInstructions && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="pt-2 space-y-4 text-gray-700 text-base">
                    <div>
                      <p className="font-semibold text-gray-900">Step 1: Set Category Importance</p>
                      <p>Each cofounder fills out their own sheet separately. Decide how important each category is on a scale of 0–100 (the total doesn't need to add up to 100).</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Step 2: Score Each Cofounder</p>
                      <p>Score every cofounder—including yourself—0–100 for each category, then click Submit. You can edit your sheet anytime, but others can't see your answers until you submit.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Step 3: Review & Finalize</p>
                      <p>Once everyone's done, compare the results together to spot differences. After discussing, enter your agreed-upon final split below.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Single container that stays intact - only content inside animates */}
        <div className="mb-8">
          <div style={{ minHeight: '700px', overflow: 'visible' }}>
            {/* Edit View - Show calculator */}
            {viewMode === 'edit' && (
              <div className={`flex flex-col ${
                slideDirection === 'exit-left' ? 'equity-view-exit-left' :
                slideDirection === 'exit-right' ? 'equity-view-exit-right' :
                slideDirection === 'enter-from-left' ? 'equity-view-enter-from-left' :
                slideDirection === 'enter-from-right' ? 'equity-view-enter-from-right' :
                ''
              }`} style={{ minHeight: '700px' }}>
                <EquityCalculator
                  cofounders={allCollaborators}
                  cofounderData={formData.cofounders}
                  userDraftData={formData.equityCalculatorDraft?.[currentUserEmail]}
                  onDraftChange={handleDraftChange}
                  onSubmit={handleSubmit}
                  isReadOnly={isReadOnly}
                  hasSubmitted={hasSubmitted}
                  submissionError={submissionError}
                  lastSubmittedAt={hasSubmitted ? formData.equityCalculatorSubmitted[currentUserEmail].submittedAt : null}
                />
              </div>
            )}

            {/* Results View - Show all assessments */}
            {viewMode === 'results' && (
              <div className={`flex flex-col ${
                slideDirection === 'exit-left' ? 'equity-view-exit-left' :
                slideDirection === 'exit-right' ? 'equity-view-exit-right' :
                slideDirection === 'enter-from-left' ? 'equity-view-enter-from-left' :
                slideDirection === 'enter-from-right' ? 'equity-view-enter-from-right' :
                ''
              }`} style={{ minHeight: '700px' }}>
                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Assessment Results</h3>
                    <p className="text-gray-600 text-sm">Review how each cofounder assessed the equity split</p>
                  </div>
                  <label className="block text-base font-medium text-gray-900 mb-3" ref={visualBarsRef}>
                    Individual Assessments
                  </label>
                  <div className="space-y-4">
                  {allCollaborators.map(assessorEmail => {
                    const hasSubmittedAssessment = !!formData.equityCalculatorSubmitted?.[assessorEmail];
                    const calculation = equityCalculations[assessorEmail];

                    // Generate greyscale colors evenly spaced from black to white
                    const numCofounders = allCollaborators.length;
                    const colors = Array.from({ length: numCofounders }, (_, i) => {
                      const value = numCofounders === 1 ? 0 : Math.round((i * 255) / (numCofounders - 1));
                      const hex = value.toString(16).padStart(2, '0');
                      return `#${hex}${hex}${hex}`;
                    });

                    return (
                      <div key={assessorEmail} className="mb-4">
                        <p className="font-medium text-gray-900 mb-3">
                          {getCofounderName(assessorEmail)}
                          {assessorEmail === currentUserEmail && <span className="ml-2 text-xs text-red-950">(You)</span>}
                        </p>
                        {!hasSubmittedAssessment ? (
                          <p className="text-sm text-gray-500 italic">
                            Submission pending
                          </p>
                        ) : calculation ? (
                          <div>
                            {/* Stacked Progress Bar */}
                            <div className="w-full h-7 bg-gray-200 rounded-lg flex relative" style={{ overflow: 'visible', border: '1px solid #000000' }}>
                              {(() => {
                                const nonZeroEntries = allCollaborators
                                  .map((email, idx) => ({ email, idx, percentage: calculation[email] || 0 }))
                                  .filter(entry => entry.percentage > 0);

                                return nonZeroEntries.map((entry, barIndex) => {
                                  const { email: cofounderEmail, idx: index, percentage } = entry;
                                  const color = colors[index % colors.length];
                                  const isFirst = barIndex === 0;
                                  const isLast = barIndex === nonZeroEntries.length - 1;
                                  const borderRadiusClass = isFirst ? 'rounded-l-lg' : isLast ? 'rounded-r-lg' : '';

                                  return (
                                    <div
                                      key={cofounderEmail}
                                      className={`transition-all duration-300 flex items-center justify-center relative ${borderRadiusClass}`}
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: color,
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
                                });
                              })()}
                            </div>

                            {/* Legend */}
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                              {allCollaborators.map((cofounderEmail, index) => {
                                const percentage = calculation[cofounderEmail] || 0;
                                const color = colors[index % colors.length];

                                return (
                                  <div key={cofounderEmail} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-sm"
                                      style={{ backgroundColor: color, border: '1px solid #000000' }}
                                    />
                                    <span className="text-sm text-gray-700">
                                      {getCofounderName(cofounderEmail)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No valid assessment (all scores are zero)
                          </p>
                        )}
                      </div>
                    );
                  })}
                  </div>

                  {/* Toggle Button for Individual Spreadsheets */}
                  <div className="border border-gray-200/50 rounded-lg mt-4 bg-gray-50/50 backdrop-blur-sm">
                    <button
                      onClick={() => setShowIndividualSpreadsheets(!showIndividualSpreadsheets)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100/50 transition-colors rounded-lg"
                    >
                      <span className="font-semibold text-gray-900">
                        {showIndividualSpreadsheets ? 'Hide All Spreadsheets' : 'Display All Spreadsheets'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${showIndividualSpreadsheets ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Individual Spreadsheets - Only show when toggled */}
                  {showIndividualSpreadsheets && (
                    <div className="mt-6 space-y-6 mb-6">
                      {allCollaborators.map(assessorEmail => {
                        const submission = formData.equityCalculatorSubmitted?.[assessorEmail];

                        if (!submission?.data) {
                          return (
                            <div key={assessorEmail} className="mb-4">
                              <p className="font-medium text-gray-900 mb-3">
                                {getCofounderName(assessorEmail)}
                                {assessorEmail === currentUserEmail && <span className="ml-2 text-xs text-red-950">(You)</span>}
                              </p>
                              <p className="text-sm text-gray-500 italic">
                                Submission pending
                              </p>
                            </div>
                          );
                        }

                        // Convert Firebase format to array if needed
                        let spreadsheetData = submission.data;
                        if (typeof spreadsheetData === 'object' && !Array.isArray(spreadsheetData)) {
                          const rowKeys = Object.keys(spreadsheetData).sort((a, b) => {
                            const aNum = parseInt(a.split('_')[1]);
                            const bNum = parseInt(b.split('_')[1]);
                            return aNum - bNum;
                          });

                          // Determine the total number of columns needed (2 fixed + cofounders)
                          const totalColumns = 2 + allCollaborators.length;

                          spreadsheetData = rowKeys.map((rowKey, rowIndex) => {
                            const row = spreadsheetData[rowKey];
                            const resultRow = [];

                            // Populate all columns, filling in blanks as needed
                            for (let colIndex = 0; colIndex < totalColumns; colIndex++) {
                              const colKey = `col_${colIndex}`;
                              if (row[colKey]) {
                                resultRow.push(row[colKey]);
                              } else {
                                // Create empty cell with appropriate properties
                                resultRow.push({
                                  value: rowIndex === 0 ? '' : 0,
                                  readOnly: rowIndex === 0 || colIndex === 0,
                                  className: rowIndex === 0 ? 'header-cell' : (colIndex === 0 ? 'category-cell' : '')
                                });
                              }
                            }

                            return resultRow;
                          });
                        }

                        return (
                          <div key={assessorEmail} className="mb-4">
                            <p className="font-medium text-gray-900 mb-3">
                              {getCofounderName(assessorEmail)}
                              {assessorEmail === currentUserEmail && <span className="ml-2 text-xs text-red-950">(You)</span>}
                            </p>
                            <div className="bg-white rounded border border-gray-200 overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {spreadsheetData[0]?.map((cell, colIndex) => (
                                      <th
                                        key={colIndex}
                                        className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200 last:border-r-0"
                                      >
                                        {cell.value}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {spreadsheetData.slice(1).map((row, rowIndex) => {
                                    // Check if this is a group header row
                                    const isGroupHeader = row[0]?.className === 'group-header-cell';

                                    return (
                                      <tr key={rowIndex}>
                                        {row.map((cell, colIndex) => (
                                          <td
                                            key={colIndex}
                                            className={`px-4 py-3 text-sm border-r border-gray-200 last:border-r-0 ${
                                              isGroupHeader
                                                ? 'font-bold text-gray-900 bg-gray-200'
                                                : colIndex === 0
                                                ? 'font-medium text-gray-900 bg-gray-50'
                                                : 'text-gray-700'
                                            }`}
                                            style={isGroupHeader ? { padding: '0.375rem 1rem', lineHeight: '1.25' } : {}}
                                          >
                                            {cell.value}
                                          </td>
                                        ))}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Back button at bottom - fixed position */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 flex-shrink-0" style={{ minHeight: '60px' }}>
                  <button
                    onClick={() => changeView('edit')}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Spreadsheet
                  </button>
                  <div className="flex flex-col items-end">
                    <div style={{ height: '28px' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Final Equity Allocation */}
        <div ref={finalEquityRef} className="pt-24">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Final Equity Allocation</h3>

          <div className="flex gap-4 mb-6">
            {allCollaborators.map((email, index) => (
              <div key={email} className="flex-1">
                <label className="block text-base font-medium text-gray-900 mb-2">
                  {getCofounderName(email)}
                  {email === project?.ownerEmail && <span className="ml-2 text-xs text-gray-500">(Owner)</span>}
                  {email === auth.currentUser?.email && <span className="ml-2 text-xs text-red-950">(You)</span>}
                  {showValidation && !formData.finalEquityPercentages?.[email] && <span className="text-red-700 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.finalEquityPercentages?.[email] ? `${formData.finalEquityPercentages[email]}%` : ''}
                  onChange={(e) => {
                    const input = e.target;
                    const cursorPos = input.selectionStart;
                    const value = e.target.value.replace('%', '');

                    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                      handleEquityChange(email, value);

                      // Keep cursor before the %
                      setTimeout(() => {
                        const newPos = Math.min(cursorPos, value.length);
                        input.setSelectionRange(newPos, newPos);
                      }, 0);
                    }
                  }}
                  onKeyDown={(e) => {
                    const input = e.target;
                    const value = input.value.replace('%', '');
                    const cursorPos = input.selectionStart;

                    // Prevent cursor from going past the number into %
                    if (e.key === 'ArrowRight' && cursorPos >= value.length) {
                      e.preventDefault();
                    }

                    // Keep cursor before % on arrow left at the end
                    if (e.key === 'ArrowLeft' && cursorPos > value.length) {
                      e.preventDefault();
                      input.setSelectionRange(value.length, value.length);
                    }
                  }}
                  onClick={(e) => {
                    const input = e.target;
                    const value = input.value.replace('%', '');
                    const cursorPos = input.selectionStart;

                    // If clicked after the %, move cursor before %
                    if (cursorPos > value.length) {
                      setTimeout(() => {
                        input.setSelectionRange(value.length, value.length);
                      }, 0);
                    }
                  }}
                  onFocus={(e) => {
                    const input = e.target;
                    const value = input.value.replace('%', '');
                    // Position cursor at end of number, before %
                    setTimeout(() => {
                      input.setSelectionRange(value.length, value.length);
                    }, 0);
                  }}
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
                  placeholder="25%"
                />
              </div>
            ))}
          </div>

          {/* Total Equity Validation */}
          <div>
            <p className="font-medium text-black">
              Total Equity: {totalEquity.toFixed(2)}%
            </p>
            {Math.abs(totalEquity - 100) > 0.01 && (
              <p className="text-sm mt-1 text-red-500">
                {totalEquity > 100.01
                  ? 'Total equity exceeds 100%. Please adjust.'
                  : 'Total equity must equal 100% before proceeding.'}
              </p>
            )}
          </div>

          {/* Acknowledgment Checkboxes */}
          <div className="mt-6">
            <p className="text-gray-700 mb-4">
              I acknowledge and accept this equity allocation.
              {showValidation && !allCollaborators.every(email => formData.acknowledgeEquityAllocation?.[email]) && <span className="text-red-700 ml-0.5 validation-error">*</span>}
            </p>
            <div className="space-y-2 pl-4">
              {allCollaborators.map((email) => {
                const isApproved = formData.acknowledgeEquityAllocation?.[email] || false;
                const isCurrentUser = email === auth.currentUser?.email;

                // Check if all equity percentages are filled and total equals 100%
                const allPercentagesFilled = allCollaborators.every(email =>
                  formData.finalEquityPercentages?.[email] && formData.finalEquityPercentages[email] !== ''
                );
                const equityValid = Math.abs(totalEquity - 100) <= 0.01;
                const canAcknowledge = allPercentagesFilled && equityValid;

                return (
                  <label key={email} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => handleAcknowledgmentChange(email, e.target.checked)}
                      disabled={isReadOnly || !isCurrentUser || !canAcknowledge}
                      className="mr-3"
                    />
                    <span className={`${!canAcknowledge ? 'text-gray-400' : 'text-gray-700'}`}>
                      {getCofounderName(email)}
                      {email === project?.ownerEmail && <span className="ml-2 text-xs text-gray-500">(Owner)</span>}
                      {isCurrentUser && <span className="ml-2 text-xs text-red-950">(You)</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Section3EquityAllocation;
