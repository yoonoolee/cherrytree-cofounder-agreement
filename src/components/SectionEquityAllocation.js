import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import EquityCalculator from './EquityCalculator';
import Spreadsheet from 'react-spreadsheet';
import { useUser } from '../contexts/UserContext';
import { useCollaborators } from '../hooks/useCollaborators';
import './Section3EquityAllocation.css';
import { FIELDS } from '../config/surveySchema';

const SectionEquityAllocation = forwardRef(({ formData, handleChange, isReadOnly, showValidation, project, onViewModeChange }, ref) => {
  const { currentUser } = useUser();
  const visualBarsRef = useRef(null);
  const { collaboratorIds, isAdmin } = useCollaborators(project);

  const currentUserId = currentUser?.id;

  // Function to get cofounder name from userId
  const getCofounderName = (userId) => {
    // Find index of this collaborator
    const index = collaboratorIds.indexOf(userId);
    // Get cofounder at that index
    const cofounder = formData[FIELDS.COFOUNDERS]?.[index];
    // Return first name if it exists, otherwise return fallback
    if (cofounder?.[FIELDS.COFOUNDER_FULL_NAME] && cofounder[FIELDS.COFOUNDER_FULL_NAME].trim() !== '') {
      const firstName = cofounder[FIELDS.COFOUNDER_FULL_NAME].trim().split(' ')[0];
      return firstName;
    }
    // Convert index to letter (0 -> A, 1 -> B, etc.)
    return `Cofounder ${String.fromCharCode(65 + index)}`;
  };

  // Initialize equity percentages, acknowledgments, and calculator data if not present
  const initializedRef = React.useRef(false);
  const [submissionError, setSubmissionError] = React.useState('');
  const [showIndividualSpreadsheets, setShowIndividualSpreadsheets] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('edit'); // 'edit', 'waiting', 'results'
  const [slideDirection, setSlideDirection] = React.useState(''); // 'exit-left', 'exit-right', 'enter-from-left', 'enter-from-right'
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);
  const [wiggleSpreadsheet, setWiggleSpreadsheet] = React.useState(false);

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

    if (!formData[FIELDS.FINAL_EQUITY_PERCENTAGES]) {
      const initialPercentages = {};
      collaboratorIds.forEach(userId => {
        initialPercentages[userId] = '';
      });
      updates.finalEquityPercentages = initialPercentages;
      needsUpdate = true;
    }
    if (!formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION]) {
      updates.acknowledgeEquityAllocation = {};
      needsUpdate = true;
    }
    if (!formData[FIELDS.EQUITY_CALCULATOR_DRAFT]) {
      updates.equityCalculatorDraft = {};
      needsUpdate = true;
    }
    if (!formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED]) {
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

  const handleEquityChange = (userId, value) => {
    const newPercentages = {
      ...(formData[FIELDS.FINAL_EQUITY_PERCENTAGES] || {}),
      [userId]: value
    };
    handleChange(FIELDS.FINAL_EQUITY_PERCENTAGES, newPercentages);

    // Uncheck all acknowledgments when any equity is changed
    handleChange(FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {});
  };

  const handleAcknowledgmentChange = (userId, checked) => {
    const newAcknowledgments = {
      ...(formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION] || {}),
      [userId]: checked
    };
    handleChange(FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, newAcknowledgments);
  };

  // Handle draft change - save to user's draft
  const handleDraftChange = (draftData) => {
    // Clear any submission errors when user makes changes
    if (submissionError) {
      setSubmissionError('');
    }

    const newDrafts = {
      ...(formData[FIELDS.EQUITY_CALCULATOR_DRAFT] || {}),
      [currentUserId]: draftData
    };
    handleChange(FIELDS.EQUITY_CALCULATOR_DRAFT, newDrafts);
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
      collaboratorIds.forEach(userId => {
        const percentage = equityPercentages[userId] || 0;
        if (percentage === 0) {
          cofoundersWithZeroEquity.push(getCofounderName(userId));
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
    const userDraft = formData[FIELDS.EQUITY_CALCULATOR_DRAFT]?.[currentUserId];

    // If no data, wiggle the spreadsheet instead of showing error
    if (!userDraft) {
      setWiggleSpreadsheet(true);
      setTimeout(() => setWiggleSpreadsheet(false), 500);
      return false;
    }

    // Validate the data
    const validation = validateSpreadsheetData(userDraft);
    if (!validation.valid) {
      setSubmissionError(validation.message);
      return false;
    }

    // Clear any previous errors
    setSubmissionError('');

    const newSubmitted = {
      ...(formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED] || {}),
      [currentUserId]: {
        data: userDraft,
        submittedAt: new Date().toISOString()
      }
    };
    handleChange(FIELDS.EQUITY_CALCULATOR_SUBMITTED, newSubmitted);

    // Navigate to results view with animation
    changeView('results');

    // Scroll to top of results section to show assessment results first
    setTimeout(() => {
      if (visualBarsRef.current) {
        visualBarsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 400);

    return true;
  };

  // Expose handleSubmit and backToEdit to parent via ref
  useImperativeHandle(ref, () => ({
    submitEquityCalculator: handleSubmit,
    backToEdit: () => changeView('edit')
  }));

  // Effect to update viewMode when submissions change
  React.useEffect(() => {
    if (hasSubmitted && viewMode === 'edit') {
      changeView('results');
    }
  }, [formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED]]);

  // Notify parent when viewMode changes
  React.useEffect(() => {
    if (onViewModeChange) {
      onViewModeChange(viewMode === 'results');
    }
  }, [viewMode, onViewModeChange]);

  // Check if current user has submitted
  const hasSubmitted = !!formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED]?.[currentUserId];

  const totalEquity = collaboratorIds.reduce((sum, userId) => {
    return sum + (parseFloat(formData[FIELDS.FINAL_EQUITY_PERCENTAGES]?.[userId]) || 0);
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
      const numCofounders = data[0].length - 2; // Subtract Category and Importance columns

      for (let cofounderIndex = 0; cofounderIndex < numCofounders; cofounderIndex++) {
        const colIndex = cofounderIndex + 2; // Start after Category and Importance
        let weightedScore = 0;

        for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
          const importance = parseFloat(data[rowIndex][1]?.value) || 0;
          const score = parseFloat(data[rowIndex][colIndex]?.value) || 0;
          const weight = importance / totalImportance;
          weightedScore += score * weight;
        }

        // Map column index to actual cofounder userId
        if (cofounderIndex < collaboratorIds.length) {
          const cofounderUserId = collaboratorIds[cofounderIndex];
          cofounderScores[cofounderUserId] = weightedScore;
        }
      }

      // Calculate total of all weighted scores
      const totalScore = Object.values(cofounderScores).reduce((sum, score) => sum + score, 0);

      if (totalScore === 0) return null;

      // Convert to percentages and round to 3 decimal places
      const equityPercentages = {};
      Object.keys(cofounderScores).forEach(userId => {
        const percentage = (cofounderScores[userId] / totalScore) * 100;
        equityPercentages[userId] = Math.round(percentage * 1000) / 1000;
      });

      return equityPercentages;
    } catch (error) {
      console.error('Error calculating equity:', error);
      return null;
    }
  };

  // Check if all cofounders have submitted
  const allSubmitted = collaboratorIds.every(userId =>
    !!formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED]?.[userId]
  );

  // Calculate equity for each person's submission
  const equityCalculations = {};
  collaboratorIds.forEach(userId => {
    const submission = formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED]?.[userId];
    if (submission?.data) {
      equityCalculations[userId] = calculateEquityFromSpreadsheet(submission.data);
    }
  });

  // Ref for scrolling to Final Equity Allocation
  const finalEquityRef = React.useRef(null);

  const scrollToFinalEquity = () => {
    finalEquityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const skipToFinalEquity = () => {
    // First, change to results view
    changeView('results');
    // Then scroll to final equity section after a short delay to ensure the view has changed
    setTimeout(() => {
      finalEquityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  return (
    <div className="equity-calculator-container">
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Equity Allocation</h2>

      <p className="mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
        A few years ago, two friends from Stanford launched a startup that took off fast. Within six months, they were in YC, had a long waiting list, and investors were calling.
      </p>
      <p className="mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
        But one cofounder started feeling like they were doing more. "I'm the CEO, I'm fundraising, I'm working longer hours." They tried to renegotiate the equity split from 50/50 to 70/30. The other cofounder felt blindsided, trust collapsed, and by Demo Day they'd split, both emotionally and legally.
      </p>
      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Be very reluctant to change equity allocation once you've agreed. The #1 reason for cofounder breakups in the most recent YC batch was cofounders trying to revisit a settled split.
      </p>

      <div className="space-y-6">
        <div className="mb-2">
          <h3 className="text-xl font-medium text-gray-800 mb-4">Equity Calculator</h3>
          <p className="text-gray-700 mb-6">
            Using the calculator is optional. Your agreement only includes the final allocation entered below. If you already know your split,{' '}
            <button
              onClick={skipToFinalEquity}
              className="font-bold text-gray-900 hover:text-red-950 underline transition-colors"
            >
              click here
            </button>
            {' '}to skip ahead.
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
                      <p>Score every cofounder, including yourself, on a scale of 0–100 for each category, then click Next. You can edit your sheet anytime, but others can't see your answers until you submit.</p>
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
          <div style={{ minHeight: '700px', overflow: 'visible' }} className="rounded-lg p-6">
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
                  cofounders={collaboratorIds}
                  cofounderData={formData[FIELDS.COFOUNDERS]}
                  userDraftData={formData[FIELDS.EQUITY_CALCULATOR_DRAFT]?.[currentUserId]}
                  onDraftChange={handleDraftChange}
                  onSubmit={handleSubmit}
                  isReadOnly={isReadOnly}
                  hasSubmitted={hasSubmitted}
                  submissionError={submissionError}
                  lastSubmittedAt={hasSubmitted ? formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED][currentUserId].submittedAt : null}
                  wiggle={wiggleSpreadsheet}
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
                  <div ref={visualBarsRef} className="pt-4">
                    <div className="mb-6">
                      <h3 className="text-xl font-medium text-gray-800 mb-2">Assessment Results</h3>
                      <p className="text-gray-600 text-sm">Review how each cofounder assessed the equity split</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                  {collaboratorIds.map(assessorUserId => {
                    const hasSubmittedAssessment = !!formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED]?.[assessorUserId];
                    const calculation = equityCalculations[assessorUserId];

                    // Generate greyscale colors evenly spaced from black to white
                    const numCofounders = collaboratorIds.length;
                    const colors = Array.from({ length: numCofounders }, (_, i) => {
                      const value = numCofounders === 1 ? 0 : Math.round((i * 255) / (numCofounders - 1));
                      const hex = value.toString(16).padStart(2, '0');
                      return `#${hex}${hex}${hex}`;
                    });

                    return (
                      <div key={assessorUserId} className="mb-4">
                        <p className="font-medium text-gray-900 mb-3">
                          {getCofounderName(assessorUserId)}
                        </p>
                        {!hasSubmittedAssessment ? (
                          <p className="text-sm text-gray-500 italic">
                            Submission pending
                          </p>
                        ) : calculation ? (
                          <div>
                            {/* Stacked Progress Bar */}
                            <div className="w-full h-7 bg-gray-200 rounded-lg flex relative" style={{ overflow: 'hidden', border: '1px solid #000000' }}>
                              {(() => {
                                const nonZeroEntries = collaboratorIds
                                  .map((userId, idx) => ({ userId, idx, percentage: calculation[userId] || 0 }))
                                  .filter(entry => entry.percentage > 0);

                                return nonZeroEntries.map((entry, barIndex) => {
                                  const { userId: cofounderUserId, idx: index, percentage } = entry;
                                  const color = colors[index % colors.length];

                                  return (
                                    <div
                                      key={cofounderUserId}
                                      className="transition-all duration-300 flex items-center justify-center relative"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: color
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
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 justify-center">
                              {collaboratorIds.map((cofounderUserId, index) => {
                                const percentage = calculation[cofounderUserId] || 0;
                                const color = colors[index % colors.length];

                                return (
                                  <div key={cofounderUserId} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-sm"
                                      style={{ backgroundColor: color, border: '1px solid #000000' }}
                                    />
                                    <span className="text-sm text-gray-700">
                                      {getCofounderName(cofounderUserId)}
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

                  {/* Action bar - fixed position after visual bars */}
                  <div className="flex items-center justify-end pt-3 mt-3 border-t border-gray-200">
                    <button
                      onClick={() => setShowIndividualSpreadsheets(!showIndividualSpreadsheets)}
                      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition"
                    >
                      <span>
                        {showIndividualSpreadsheets ? "Hide everyone's spreadsheets" : "Display everyone's spreadsheets"}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${showIndividualSpreadsheets ? 'rotate-180' : ''}`}
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
                      {collaboratorIds.map(assessorUserId => {
                        const submission = formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED]?.[assessorUserId];

                        if (!submission?.data) {
                          return (
                            <div key={assessorUserId} className="mb-4">
                              <p className="font-medium text-gray-900 mb-3">
                                {getCofounderName(assessorUserId)}
                                    </p>
                              <p className="text-sm text-gray-500 italic">
                                Submission pending
                              </p>
                            </div>
                          );
                        }

                        // Convert Firebase format to array if needed
                        let spreadsheetData = submission.data;

                        // Define complete category list (must match EquityCalculator)
                        const categories = [
                          'Input', 'Cash Invested', 'Time Commitment', 'Existing Work & IP', 'Equipment & Tools',
                          'Execution', 'Leadership & Management', 'Engineering', 'Sales', 'Product', 'Fundraising', 'Recruiting', 'Operations',
                          'Intangibles', 'Domain Expertise', 'Network Value', 'Irreplaceability', 'Role Scalability', 'Opportunity Cost', 'Risk Tolerance', 'Idea Origination'
                        ];

                        if (typeof spreadsheetData === 'object' && !Array.isArray(spreadsheetData)) {
                          const firebaseData = spreadsheetData;
                          const rowKeys = Object.keys(firebaseData).sort((a, b) => {
                            const aNum = parseInt(a.split('_')[1]);
                            const bNum = parseInt(b.split('_')[1]);
                            return aNum - bNum;
                          });

                          const totalColumns = 2 + collaboratorIds.length;

                          spreadsheetData = rowKeys.map((rowKey, rowIndex) => {
                            const row = firebaseData[rowKey];
                            const resultRow = [];

                            for (let colIndex = 0; colIndex < totalColumns; colIndex++) {
                              const colKey = `col_${colIndex}`;
                              const cell = row?.[colKey];

                              // Build the row first to check the first cell value
                              const cellValue = cell?.value !== undefined ? cell.value : 0;

                              // Determine className based on position and content
                              let className = cell?.className || '';

                              // After we have all cells in the row, we'll update classNames
                              if (cell) {
                                resultRow.push({
                                  value: cellValue,
                                  readOnly: true,
                                  className: className
                                });
                              } else {
                                resultRow.push({
                                  value: 0,
                                  readOnly: true,
                                  className: ''
                                });
                              }
                            }

                            // Now update classNames based on row content
                            const firstCellValue = resultRow[0]?.value;
                            const isSeparatorRow = firstCellValue === 'Input' || firstCellValue === 'Execution' || firstCellValue === 'Intangibles';
                            const isHeaderRow = rowIndex === 0;

                            resultRow.forEach((cell, colIndex) => {
                              const isFirstColumn = colIndex === 0;

                              // Force separator rows to have empty values and proper styling
                              if (isSeparatorRow && !isFirstColumn) {
                                cell.value = '';
                                cell.readOnly = true;
                                cell.className = 'separator-cell';
                              } else if (!cell.className) {
                                if (isHeaderRow) {
                                  cell.className = 'header-cell';
                                } else if (isSeparatorRow && isFirstColumn) {
                                  cell.className = 'category-cell separator-cell';
                                } else if (isFirstColumn) {
                                  cell.className = 'category-cell';
                                }
                              }
                            });

                            return resultRow;
                          });
                        } else if (Array.isArray(spreadsheetData)) {
                          spreadsheetData = spreadsheetData.map((row, rowIndex) =>
                            row.map((cell, colIndex) => {
                              // Check if this row is a separator row based on the first cell value
                              const firstCellValue = row[0]?.value;
                              const isSeparatorRow = firstCellValue === 'Input' || firstCellValue === 'Execution' || firstCellValue === 'Intangibles';
                              const isHeaderRow = rowIndex === 0;
                              const isFirstColumn = colIndex === 0;

                              // Force separator rows to have empty values
                              if (isSeparatorRow && !isFirstColumn) {
                                return {
                                  value: '',
                                  readOnly: true,
                                  className: 'separator-cell'
                                };
                              }

                              // Determine the appropriate className
                              let className = cell.className || '';

                              if (isHeaderRow) {
                                className = className || 'header-cell';
                              } else if (isSeparatorRow && isFirstColumn) {
                                className = className || 'category-cell separator-cell';
                              } else if (isFirstColumn) {
                                className = className || 'category-cell';
                              }

                              return {
                                ...cell,
                                readOnly: true,
                                className: className
                              };
                            })
                          );
                        }

                        // Ensure we have the complete structure with all rows
                        // Expected: 1 header + 21 categories = 22 rows
                        const expectedRowCount = 1 + categories.length;

                        if (spreadsheetData && spreadsheetData.length < expectedRowCount) {
                          // Rebuild complete structure if data is incomplete
                          const numCofounders = collaboratorIds.length;
                          const completeData = [];

                          // Header row
                          completeData.push([
                            { value: 'Category', readOnly: true, className: 'header-cell' },
                            { value: 'Importance', readOnly: true, className: 'header-cell' },
                            ...collaboratorIds.map(userId => ({
                              value: getCofounderName(userId),
                              readOnly: true,
                              className: 'header-cell'
                            }))
                          ]);

                          // Category rows
                          categories.forEach((category, index) => {
                            const dataRowIndex = index + 1;
                            const existingRow = spreadsheetData[dataRowIndex];
                            const isSeparatorRow = category === 'Input' || category === 'Execution' || category === 'Intangibles';

                            if (isSeparatorRow) {
                              // Separator rows: always empty values with grey styling
                              completeData.push([
                                {
                                  value: category,
                                  readOnly: true,
                                  className: 'category-cell separator-cell'
                                },
                                { value: '', readOnly: true, className: 'separator-cell' },
                                ...collaboratorIds.map(() => ({ value: '', readOnly: true, className: 'separator-cell' }))
                              ]);
                            } else if (existingRow) {
                              // Use existing data but ensure all columns exist
                              completeData.push([
                                {
                                  value: category,
                                  readOnly: true,
                                  className: 'category-cell'
                                },
                                existingRow[1] || { value: 0, readOnly: true },
                                ...collaboratorIds.map((_, idx) =>
                                  existingRow[idx + 2] || { value: 0, readOnly: true }
                                )
                              ]);
                            } else {
                              // Create default row
                              completeData.push([
                                {
                                  value: category,
                                  readOnly: true,
                                  className: 'category-cell'
                                },
                                { value: 0, readOnly: true },
                                ...Array(numCofounders).fill(null).map(() => ({ value: 0, readOnly: true }))
                              ]);
                            }
                          });

                          spreadsheetData = completeData;
                        }

                        return (
                          <div key={assessorUserId} className="mb-6">
                            <p className="font-medium text-gray-900 mb-3">
                              {getCofounderName(assessorUserId)}
                                </p>
                            <div className="spreadsheet-wrapper" style={{ overflow: 'visible' }}>
                              <div
                                className="spreadsheet-scroll-container"
                                style={{
                                  overflowX: 'auto',
                                  overflowY: 'visible',
                                  position: 'relative'
                                }}
                              >
                                <Spreadsheet
                                  data={spreadsheetData}
                                  onChange={() => {}} // No-op since it's read-only
                                  columnLabels={false}
                                  rowLabels={false}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Final Equity Allocation - Only show in results view */}
        {viewMode === 'results' && (
          <div ref={finalEquityRef} className={showIndividualSpreadsheets ? "pt-4" : "pt-2"}>
            <h3 className="text-xl font-medium text-gray-800 mb-6">Final Equity Allocation</h3>

          <div className="flex gap-4 mb-6">
            {collaboratorIds.map((userId, index) => (
              <div key={userId} className="flex-1">
                <label className="block text-base font-medium text-gray-900 mb-2">
                  {getCofounderName(userId)}
                  {isAdmin(userId) && <span className="ml-2 text-xs text-gray-500">(Admin)</span>}
                  {showValidation && !formData[FIELDS.FINAL_EQUITY_PERCENTAGES]?.[userId] && <span className="text-red-700 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  value={formData[FIELDS.FINAL_EQUITY_PERCENTAGES]?.[userId] ? `${formData[FIELDS.FINAL_EQUITY_PERCENTAGES][userId]}%` : ''}
                  onChange={(e) => {
                    const input = e.target;
                    const cursorPos = input.selectionStart;
                    const value = e.target.value.replace('%', '');

                    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                      handleEquityChange(userId, value);

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
            <p className="text-gray-700 mb-2">
              I acknowledge and accept this equity allocation.
              {showValidation && !collaboratorIds.every(userId => formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION]?.[userId]) && <span className="text-red-700 ml-0.5 validation-error">*</span>}
            </p>
            <p className="text-gray-600 text-sm mb-4 italic">
              This equity calculator is for informational and planning purposes only. Using it does not grant, issue, vest, or transfer any equity, securities, or ownership interest of any kind. No equity exists unless and until it is formally approved and issued through proper corporate action (e.g., board approval) and documented via legally binding agreements (such as a stock purchase agreement, option grant, or equity incentive plan). You must complete the required legal and administrative steps for any equity to be valid.
            </p>
            <div className="space-y-2 pl-4">
              {collaboratorIds.map((userId) => {
                const isApproved = formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION]?.[userId] || false;
                const isCurrentUser = userId === currentUserId;

                // Check if all equity percentages are filled and total equals 100%
                const allPercentagesFilled = collaboratorIds.every(userId =>
                  formData[FIELDS.FINAL_EQUITY_PERCENTAGES]?.[userId] && formData[FIELDS.FINAL_EQUITY_PERCENTAGES][userId] !== ''
                );
                const equityValid = Math.abs(totalEquity - 100) <= 0.01;
                const canAcknowledge = allPercentagesFilled && equityValid;

                return (
                  <label key={userId} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => handleAcknowledgmentChange(userId, e.target.checked)}
                      disabled={isReadOnly || !isCurrentUser || !canAcknowledge}
                      className="mr-3"
                    />
                    <span className={`${!canAcknowledge ? 'text-gray-400' : 'text-gray-700'}`}>
                      {getCofounderName(userId)}
                      {isAdmin(userId) && <span className="ml-2 text-xs text-gray-500">(Admin)</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default SectionEquityAllocation;
