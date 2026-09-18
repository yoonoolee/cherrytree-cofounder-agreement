import React, { useState, useEffect, useRef } from 'react';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';
import MarketingGrain from '../components/MarketingGrain';
import { usePageMeta } from '../hooks/usePageMeta';
import Spreadsheet from 'react-spreadsheet';
import '../components/EquityCalculator.css';
import { calculateEquityPercentages } from '../utils/equityCalculation';

function EquityCalculatorPage() {
  // SEO meta tags
  usePageMeta({
    title: 'Free Equity Calculator - Cherrytree | Fair Cofounder Equity Split Tool',
    description: 'Calculate fair equity splits for your startup cofounders. Free interactive tool to determine cofounder equity percentages based on contributions, risk, and commitment.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Equity Calculator' }
    ]
  });

  const [numCofounders, setNumCofounders] = useState(2);
  const [cofounderNames, setCofounderNames] = useState(['', '']);
  const [showCalculator, setShowCalculator] = useState(false);
  const [wiggleIndex, setWiggleIndex] = useState(null);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const spreadsheetRef = useRef(null);

  // Handle start calculator with validation
  const handleStartCalculator = () => {
    // Check if first two cofounders have names
    const firstName = cofounderNames[0]?.trim();
    const secondName = cofounderNames[1]?.trim();

    if (!firstName && !secondName) {
      // Both empty - wiggle first
      setWiggleIndex(0);
      setTimeout(() => setWiggleIndex(null), 500);
      return;
    }

    if (!firstName) {
      setWiggleIndex(0);
      setTimeout(() => setWiggleIndex(null), 500);
      return;
    }

    if (!secondName) {
      setWiggleIndex(1);
      setTimeout(() => setWiggleIndex(null), 500);
      return;
    }

    setShowCalculator(true);
  };

  // Get display name for cofounder
  const getCofounderDisplayName = (index) => {
    const name = cofounderNames[index]?.trim();
    if (name) {
      return name.split(' ')[0]; // First name only
    }
    return `Cofounder ${index + 1}`;
  };

  // Initialize spreadsheet data
  const initializeData = () => {
    const rows = [
      'Category',
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

    return rows.map((rowLabel, index) => {
      // Header row
      if (index === 0) {
        return [
          { value: 'Category', readOnly: true, className: 'header-cell' },
          { value: 'Importance', readOnly: true, className: 'header-cell' },
          ...Array.from({ length: numCofounders }, (_, i) => ({
            value: getCofounderDisplayName(i),
            readOnly: true,
            className: 'header-cell'
          }))
        ];
      }

      // Section headers
      if (rowLabel === 'Input' || rowLabel === 'Execution' || rowLabel === 'Intangibles') {
        return [
          { value: rowLabel, readOnly: true, className: 'category-cell separator-cell' },
          { value: '', readOnly: true, className: 'separator-cell' },
          ...Array.from({ length: numCofounders }, () => ({ value: '', readOnly: true, className: 'separator-cell' }))
        ];
      }

      // Regular rows
      return [
        { value: rowLabel, readOnly: true, className: 'category-cell' },
        { value: 0 },
        ...Array.from({ length: numCofounders }, () => ({ value: 0 }))
      ];
    });
  };

  const [data, setData] = useState(initializeData());

  // Update data when cofounders change
  useEffect(() => {
    if (showCalculator) {
      setData(initializeData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numCofounders, cofounderNames, showCalculator]);

  // Calculate equity percentages using shared utility (returns array for this standalone page)
  const currentEquity = calculateEquityPercentages(data);

  // Handle spreadsheet changes
  const handleChange = (newData) => {
    const preservedData = newData.map((row, rowIndex) => {
      return row.map((cell, colIndex) => {
        if (rowIndex === 0) {
          return { ...cell, readOnly: true, className: 'header-cell' };
        }

        const categoryName = row[0]?.value;
        const isSeparatorRow = categoryName === 'Input' || categoryName === 'Execution' || categoryName === 'Intangibles';

        if (colIndex === 0) {
          return {
            ...cell,
            readOnly: true,
            className: isSeparatorRow ? 'category-cell separator-cell' : 'category-cell'
          };
        }

        if (isSeparatorRow) {
          return { ...cell, value: '', readOnly: true, className: 'separator-cell' };
        }

        const value = cell.value;
        const oldValue = data[rowIndex]?.[colIndex]?.value || 0;

        if (value === '' || value === null || value === undefined) {
          return { ...cell, value: 0 };
        }

        const valueStr = String(value);
        if (valueStr.includes('.')) {
          return { ...cell, value: oldValue };
        }

        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
          return { ...cell, value: numValue };
        }

        return { ...cell, value: oldValue };
      });
    });
    setData(preservedData);
  };


  // Handle cofounder name change
  const handleNameChange = (index, name) => {
    setCofounderNames(prev => {
      const newNames = [...prev];
      newNames[index] = name;
      return newNames;
    });
  };

  // Make single click behave like double click
  useEffect(() => {
    if (!showCalculator) return;

    const handleClick = (e) => {
      const cell = e.target.closest('.Spreadsheet__cell');
      if (cell && !cell.classList.contains('Spreadsheet__cell--readonly')) {
        e.preventDefault();
        e.stopPropagation();
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
  }, [showCalculator]);

  // Equity Progress Bar component
  const EquityProgressBar = ({ equity }) => {
    if (!equity) {
      return null;
    }

    const numCof = equity.length;
    const colors = Array.from({ length: numCof }, (_, i) => {
      const value = numCof === 1 ? 0 : Math.round((i * 255) / (numCof - 1));
      const hex = value.toString(16).padStart(2, '0');
      return `#${hex}${hex}${hex}`;
    });

    return (
      <div className="w-full">
        <div className="w-full h-7 bg-gray-200 rounded-lg flex relative overflow-hidden" style={{ border: '1px solid #000000' }}>
          {equity.map((percentage, index) => {
            if (percentage === 0) return null;
            return (
              <div
                key={index}
                className="transition-all duration-300 flex items-center justify-center relative"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors[index]
                }}
              >
                <span
                  className="font-semibold whitespace-nowrap"
                  style={{
                    fontSize: percentage >= 10 ? '0.75rem' : '0.5rem',
                    paddingLeft: percentage >= 10 ? '0.25rem' : '0.125rem',
                    paddingRight: percentage >= 10 ? '0.25rem' : '0.125rem',
                    color: index < Math.ceil(numCof / 2) ? '#FFFFFF' : '#000000',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  {percentage.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 justify-center">
          {equity.map((percentage, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: colors[index], border: '1px solid #000000' }}
              />
              <span className="text-sm text-gray-700">
                {getCofounderDisplayName(index)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="lp" style={{ minHeight: '100vh' }}>
      <MarketingGrain />
      <MarketingNav />

      <section className="lp-eq-section">
        <div className="lp-eq-wrap">
          <div className="lp-eq-card">
            <div className="lp-eq-hero">
              <h1 className="lp-page-h1" style={{ fontSize: 'clamp(32px,5vw,48px)', marginBottom: 10 }}>Equity Calculator.</h1>
              <p className="lp-page-sub">Determine a fair split based on each cofounder's contributions.</p>
            </div>

            {!showCalculator ? (
              <form
                className="lp-eq-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStartCalculator();
                }}
              >
                {/* Cofounder names */}
                <div className="lp-eq-field-group">
                  <label className="lp-eq-label">Cofounder Names</label>
                  <div className="lp-eq-name-list">
                    {Array.from({ length: numCofounders }, (_, i) => (
                      <div key={i} className="lp-eq-name-row">
                        <input
                          type="text"
                          value={cofounderNames[i] || ''}
                          onChange={(e) => handleNameChange(i, e.target.value)}
                          placeholder={i === 0 ? 'Cofounder 1 (you)' : `Cofounder ${i + 1}`}
                          className={`lp-eq-input ${wiggleIndex === i ? 'animate-wiggle' : ''}`}
                        />
                        {i >= 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setNumCofounders(prev => prev - 1);
                              setCofounderNames(prev => prev.filter((_, idx) => idx !== i));
                            }}
                            className="lp-eq-remove-btn"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add cofounder button */}
                  {numCofounders < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNumCofounders(prev => prev + 1);
                        setCofounderNames(prev => [...prev, '']);
                      }}
                      className="lp-btn-ghost lp-eq-add-btn"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add cofounder
                    </button>
                  )}
                </div>

                {/* Start button */}
                <button type="submit" className="button-shimmer lp-btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                  Start Calculator
                </button>
              </form>
            ) : (
              <div>
                {/* Back button */}
                <button onClick={() => setShowCalculator(false)} className="lp-btn-ghost lp-eq-back-btn">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to setup
                </button>

                {/* Instructions */}
                <div className="lp-eq-instructions">
                  <p><strong>How to use:</strong> Rate the importance of each category (0-100), then score each cofounder (0-100) on how much they contribute to that category. The calculator will determine equity based on weighted contributions.</p>
                </div>

                {/* Spreadsheet */}
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
                <div className="lp-eq-bar-wrap">
                  <EquityProgressBar equity={currentEquity} />
                </div>

                {/* Share button */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowSharePopup(true)}
                    className="button-shimmer lp-btn-primary"
                  >
                    Share with cofounder
                  </button>
                </div>

                {/* Share popup */}
                {showSharePopup && (
                  <div className="lp-eq-modal-backdrop">
                    <div className="lp-eq-modal">
                      <div className="lp-eq-modal-head">
                        <h3>Share with cofounder</h3>
                        <button
                          onClick={() => {
                            setShowSharePopup(false);
                            setLinkCopied(false);
                          }}
                          className="lp-eq-modal-close"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="lp-eq-modal-desc">
                        Share this link with your cofounder and see if your answers match. Only 2% get the exact same results.
                      </p>
                      <div className="lp-eq-modal-row">
                        <input type="text" readOnly value={window.location.href} className="lp-eq-modal-input" />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            setLinkCopied(true);
                          }}
                          className="lp-btn-primary"
                          style={{ padding: '10px 18px', fontSize: 13 }}
                        >
                          {linkCopied ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            'Copy'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

export default EquityCalculatorPage;
