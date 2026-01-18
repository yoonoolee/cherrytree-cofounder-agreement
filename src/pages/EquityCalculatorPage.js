import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { usePageMeta } from '../hooks/usePageMeta';
import Footer from '../components/Footer';
import Spreadsheet from 'react-spreadsheet';
import '../components/EquityCalculator.css';

function EquityCalculatorPage() {
  useScrollAnimation();

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

  // Trigger hero content fade-in on mount
  useEffect(() => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      setTimeout(() => {
        heroContent.classList.add('section-visible');
      }, 100);
    }
  }, []);

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
  }, [numCofounders, cofounderNames, showCalculator]);

  // Calculate equity percentages
  const calculateEquity = () => {
    try {
      let totalImportance = 0;
      for (let i = 1; i < data.length; i++) {
        const importance = parseFloat(data[i][1]?.value) || 0;
        totalImportance += importance;
      }

      if (totalImportance === 0) return null;

      const cofounderScores = [];
      for (let cofounderIndex = 0; cofounderIndex < numCofounders; cofounderIndex++) {
        const colIndex = cofounderIndex + 2;
        let weightedScore = 0;

        for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
          const importance = parseFloat(data[rowIndex][1]?.value) || 0;
          const score = parseFloat(data[rowIndex][colIndex]?.value) || 0;
          const weight = importance / totalImportance;
          weightedScore += score * weight;
        }

        cofounderScores.push(weightedScore);
      }

      const totalScore = cofounderScores.reduce((sum, score) => sum + score, 0);
      if (totalScore === 0) return null;

      return cofounderScores.map(score => Math.round((score / totalScore) * 100 * 1000) / 1000);
    } catch (error) {
      return null;
    }
  };

  const currentEquity = calculateEquity();

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

  // Handle number of cofounders change
  const handleNumCofoundersChange = (num) => {
    setNumCofounders(num);
    setCofounderNames(prev => {
      const newNames = [...prev];
      while (newNames.length < num) {
        newNames.push('');
      }
      return newNames.slice(0, num);
    });
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
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <section className="pt-32 pb-48 px-6 relative" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
        <div className="max-w-xl mx-auto relative">
          <div
            className="rounded-lg p-6 md:p-12"
            style={{
              background: '#fcfcfc',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
          >
          <div className="hero-content section-visible text-center mb-16">
            <h1 className="font-heading text-[56px] font-normal mb-6">
              Equity Calculator<span style={{ marginLeft: '0.05em' }}>.</span>
            </h1>
            <p className="text-[16px] font-normal" style={{ color: '#716B6B' }}>
              Determine a fair split based on each cofounder's contributions.
            </p>
          </div>

          {!showCalculator ? (
            <form
              className="max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                handleStartCalculator();
              }}
            >
              {/* Cofounder names */}
              <div className="mb-6">
                <label className="block text-base font-medium text-gray-900 mb-3">
                  Cofounder Names
                </label>
                <div className="space-y-3">
                  {Array.from({ length: numCofounders }, (_, i) => (
                    <div key={i} className="relative">
                      <input
                        type="text"
                        value={cofounderNames[i] || ''}
                        onChange={(e) => handleNameChange(i, e.target.value)}
                        placeholder={i === 0 ? 'Cofounder 1 (you)' : `Cofounder ${i + 1}`}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent ${wiggleIndex === i ? 'animate-wiggle' : ''}`}
                      />
                      {i >= 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNumCofounders(prev => prev - 1);
                            setCofounderNames(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    className="mt-3 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add cofounder
                  </button>
                )}
              </div>

              {/* Start button */}
              <button
                type="submit"
                className="button-shimmer w-full py-3 px-6 bg-[#000000] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors font-medium"
              >
                Start Calculator
              </button>
            </form>
          ) : (
            <div>
              {/* Back button */}
              <button
                onClick={() => setShowCalculator(false)}
                className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to setup
              </button>

              {/* Instructions */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>How to use:</strong> Rate the importance of each category (0-100), then score each cofounder (0-100) on how much they contribute to that category. The calculator will determine equity based on weighted contributions.
                </p>
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
              <div className="py-6">
                <EquityProgressBar equity={currentEquity} />
              </div>

              {/* Share button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowSharePopup(true)}
                  className="button-shimmer px-6 py-3 bg-[#000000] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors font-medium"
                >
                  Share with cofounder
                </button>
              </div>

              {/* Share popup */}
              {showSharePopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Share with cofounder</h3>
                      <button
                        onClick={() => {
                          setShowSharePopup(false);
                          setLinkCopied(false);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Share this link with your cofounder and see if your answers match. Only 2% get the exact same results.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={window.location.href}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          setLinkCopied(true);
                        }}
                        className="px-4 py-2 bg-[#000000] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors text-sm font-medium"
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

      <Footer />
    </div>
  );
}

export default EquityCalculatorPage;
