import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './EquityCalculatorModal.css';

// Category list grouped into buckets — matches Anika's final-eqc3 design.
const GROUPS = [
  { name: 'Input', categories: ['Cash Invested', 'Time Commitment', 'Existing Work & IP', 'Equipment & Tools'] },
  { name: 'Execution', categories: ['Leadership & Management', 'Engineering', 'Sales', 'Product', 'Fundraising', 'Recruiting', 'Operations'] },
  { name: 'Intangibles', categories: ['Domain Expertise', 'Network Value', 'Irreplaceability', 'Role Scalability', 'Opportunity Cost', 'Risk Tolerance', 'Idea Origination'] },
];
const CATEGORIES = GROUPS.flatMap(g => g.categories.map(name => ({ name, group: g.name })));

// Weighted-average split: each cofounder's share = sum(importance * score) / sum(importance) for all
// categories rated important, normalized to 100%.
export function calculateSplit(importance, scores, numCofounders) {
  const active = CATEGORIES.filter(c => (importance[c.name] || 0) > 0);
  if (!active.length) return null;
  const weighted = Array.from({ length: numCofounders }, (_, ci) =>
    active.reduce((sum, c) => sum + (importance[c.name] || 0) * ((scores[ci] || {})[c.name] || 0), 0)
  );
  const total = weighted.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return weighted.map(w => (w / total) * 100);
}

function EquityCalculatorModal({
  cofounderNames,
  myDraft,
  otherSubmissions, // { statusList: [{ name, submitted }], entries: [{ name, importance, scores }] }
  onDraftChange,
  onSubmit,
  onUseSplit,
  onClose,
}) {
  const numCofounders = cofounderNames.length;
  const [step, setStep] = useState('quiz');
  const [catIdx, setCatIdx] = useState(0);
  const [importance, setImportance] = useState(myDraft?.importance || {});
  const [scores, setScores] = useState(myDraft?.scores || {});
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [previewAnyway, setPreviewAnyway] = useState(false);

  const cat = CATEGORIES[catIdx];
  const isFirst = catIdx === 0;
  const isLast = catIdx === CATEGORIES.length - 1;

  const mySplit = useMemo(() => calculateSplit(importance, scores, numCofounders), [importance, scores, numCofounders]);

  // Live preview: fall back to a neutral score of 1 wherever the user hasn't scored yet,
  // so the floating panel reacts as soon as importance is set rather than staying blank.
  const previewSplit = useMemo(() => {
    const active = CATEGORIES.filter(c => (importance[c.name] || 0) > 0);
    if (!active.length) return null;
    const weighted = Array.from({ length: numCofounders }, (_, ci) =>
      active.reduce((sum, c) => {
        const score = (scores[ci] || {})[c.name];
        return sum + (importance[c.name] || 0) * (score != null ? score : 1);
      }, 0)
    );
    const total = weighted.reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    return weighted.map(w => (w / total) * 100);
  }, [importance, scores, numCofounders]);

  const persist = (nextImportance, nextScores) => {
    onDraftChange({ importance: nextImportance, scores: nextScores });
  };

  const updateImportance = (val) => {
    const next = { ...importance, [cat.name]: val };
    setImportance(next);
    persist(next, scores);
  };

  const updateScore = (ci, val) => {
    const next = { ...scores, [ci]: { ...(scores[ci] || {}), [cat.name]: val } };
    setScores(next);
    persist(importance, next);
  };

  const goBack = () => {
    if (isFirst) { onClose(); return; }
    setCatIdx(catIdx - 1);
  };

  const goNext = () => {
    if (isLast) {
      onSubmit({ importance, scores });
      setStep('compare');
      return;
    }
    setCatIdx(catIdx + 1);
  };

  const jumpTo = (idx) => {
    setCatIdx(idx);
    setSectionsOpen(false);
  };

  const totalOthers = otherSubmissions.statusList.length;
  const allOthersSubmitted = totalOthers > 0 && otherSubmissions.entries.length === totalOthers;
  const showLockState = totalOthers > 0 && !allOthersSubmitted && !previewAnyway;

  return createPortal(
    <div className="eq-modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="eq-modal">
        <div className="eq-modal-header">
          <div className="eq-modal-title">Equity Calculator</div>
          <button className="eq-modal-close" onClick={onClose}>×</button>
        </div>

        {step === 'quiz' && (
          <div className="eq-sections-bar">
            <button className="eq-sections-toggle" onClick={() => setSectionsOpen(!sectionsOpen)}>
              All sections {sectionsOpen ? '▴' : '▾'}
            </button>
            <div className={`eq-sections-dropdown${sectionsOpen ? ' open' : ''}`}>
              <div className="eq-sections-inner">
                {GROUPS.map((g) => (
                  <div key={g.name} className="eq-sections-group">
                    <div className="eq-sections-group-label">{g.name}</div>
                    <div className="eq-sections-chips">
                      {g.categories.map((name) => {
                        const idx = CATEGORIES.findIndex(c => c.name === name);
                        return (
                          <button
                            key={name}
                            type="button"
                            className={`eq-section-chip${idx === catIdx ? ' current' : ''}`}
                            onClick={() => jumpTo(idx)}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="eq-step-indicator">
          <div className={`eq-step-dot${step === 'compare' ? ' done' : ' active'}`} onClick={() => setStep('quiz')}>
            <div className="eq-step-circle">1</div>
            <div className="eq-step-label">Rate</div>
          </div>
          <div className={`eq-step-dot${step === 'compare' ? ' active' : ''}`}>
            <div className="eq-step-circle">2</div>
            <div className="eq-step-label">Compare</div>
          </div>
        </div>

        {step === 'quiz' && (
          <div className="eq-panel active">
            <div className="eq-privacy-badge">
              <svg width="11" height="13" viewBox="0 0 11 13" fill="none" style={{ flexShrink: 0, marginRight: 1 }}>
                <rect x="1" y="5.5" width="9" height="7" rx="1.5" stroke="#5a5650" strokeWidth="1.3" />
                <path d="M3 5.5V3.5a2.5 2.5 0 0 1 5 0v2" stroke="#5a5650" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Only you can see this until you submit
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <div className="eq-quiz-cat-name">{cat.name}</div>
              <span style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>{catIdx + 1} / {CATEGORIES.length}</span>
            </div>
            <div className="eq-quiz-cat-group">{cat.group}</div>

            <div className="eq-quiz-group">
              <div className="eq-quiz-group-label">How important is this?</div>
              <div className="eq-slider-wrap">
                <input className="eq-slider" type="range" min={0} max={10} value={importance[cat.name] || 0} onChange={(e) => updateImportance(Number(e.target.value))} />
                <span className="eq-slider-val">{importance[cat.name] || 0}</span>
              </div>
            </div>

            <div className={`eq-quiz-group eq-quiz-scores-section${(importance[cat.name] || 0) === 0 ? ' muted' : ''}`}>
              <div className="eq-quiz-group-label">Score each cofounder</div>
              <p style={{ fontSize: 11, color: '#bbb', margin: '0 0 12px', lineHeight: 1.6 }}>
                Think about past contributions and expected future involvement — 0 = little to none, 10 = primary driver.
              </p>
              {cofounderNames.map((name, ci) => (
                <div key={ci} className="eq-quiz-cf-row" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <span className="eq-quiz-cf-name" style={{ flex: '0 0 100%' }}>{name}</span>
                  <div className="eq-circle-wrap">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`eq-circle-btn${(scores[ci] || {})[cat.name] === n ? ' selected' : ''}`}
                        onClick={() => updateScore(ci, n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="eq-step-nav">
              <button className="eq-back-btn" onClick={goBack}>{isFirst ? 'Cancel' : '← Back'}</button>
              <button className="eq-next-btn" onClick={goNext}>{isLast ? 'See Results →' : 'Next →'}</button>
            </div>
          </div>
        )}

        {step === 'compare' && (
          <div className="eq-panel active">
            {showLockState ? (
              <div className="eq-lock-state">
                <div className="eq-lock-icon">🔒</div>
                <div className="eq-lock-title">Comparison unlocks when everyone submits</div>
                <div className="eq-lock-desc">Once all cofounders have scored, you'll see their suggested splits too. Your answers stay private until they submit.</div>
                <div className="eq-submit-status">
                  {otherSubmissions.statusList.map((s, i) => (
                    <div key={i} className="eq-status-item">
                      <span className={`eq-status-dot ${s.submitted ? 'submitted' : 'pending'}`}></span>
                      {s.name}{s.submitted ? ' — submitted ✓' : ' — working…'}
                    </div>
                  ))}
                </div>
                <button className="eq-next-btn" onClick={() => setPreviewAnyway(true)}>Preview comparison →</button>
              </div>
            ) : (
              <>
                <div className="eq-suggested">
                  <div className="eq-suggested-label">Your Suggestion</div>
                  {cofounderNames.map((name, ci) => {
                    const pct = mySplit?.[ci] || 0;
                    return (
                      <div key={ci} className="eq-suggested-row">
                        <span className="eq-suggested-name">{name}</span>
                        <div className="eq-suggested-bar-track"><div className="eq-suggested-bar-fill" style={{ width: `${pct}%` }} /></div>
                        <span className="eq-suggested-pct">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>

                <div className="eq-compare-section-label">Category Breakdown</div>
                {CATEGORIES.filter(c => (importance[c.name] || 0) > 0).map((c) => {
                  const catScores = cofounderNames.map((_, ci) => (scores[ci] || {})[c.name] || 0);
                  const delta = Math.max(...catScores) - Math.min(...catScores);
                  return (
                    <div key={c.name} className="eq-compare-category">
                      <div className="eq-compare-cat-name">
                        {c.name}
                        <span className={`eq-compare-delta ${delta >= 4 ? 'big' : 'small'}`}>Δ {delta}</span>
                      </div>
                      {cofounderNames.map((name, ci) => (
                        <div key={ci} className="eq-compare-bar-row">
                          <span className="eq-compare-bar-label">{name}</span>
                          <div className="eq-compare-bar-track"><div className="eq-compare-bar-fill" style={{ width: `${catScores[ci] * 10}%` }} /></div>
                          <span className="eq-compare-bar-val">{catScores[ci]}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {otherSubmissions.entries.length > 0 && (
                  <>
                    <div className="eq-compare-section-label">Other Submissions</div>
                    {otherSubmissions.entries.map((sub, i) => {
                      const otherSplit = calculateSplit(sub.importance, sub.scores, numCofounders);
                      return (
                        <div key={i} className="eq-suggested" style={{ marginBottom: 12 }}>
                          <div className="eq-suggested-label">{sub.name}'s Suggestion</div>
                          {cofounderNames.map((name, ci) => {
                            const pct = otherSplit?.[ci] || 0;
                            return (
                              <div key={ci} className="eq-suggested-row">
                                <span className="eq-suggested-name">{name}</span>
                                <div className="eq-suggested-bar-track"><div className="eq-suggested-bar-fill" style={{ width: `${pct}%` }} /></div>
                                <span className="eq-suggested-pct">{pct.toFixed(1)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}

            <div className="eq-step-nav">
              <button className="eq-back-btn" onClick={() => { setCatIdx(CATEGORIES.length - 1); setStep('quiz'); }}>← Edit scores</button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                {mySplit && (
                  <button className="eq-next-btn" onClick={() => onUseSplit(mySplit)}>Use this split →</button>
                )}
                <button className="eq-next-btn" style={{ opacity: 0.4, fontWeight: 400 }} onClick={onClose}>Agree on another split</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {step === 'quiz' && (
        <div className="eq-float-preview visible">
          <div className="eq-float-label">Estimated Split</div>
          {cofounderNames.map((name, ci) => (
            <div key={ci} className="eq-float-row">
              <span className="eq-float-name">{name}</span>
              <span className="eq-float-pct">{previewSplit ? `${previewSplit[ci].toFixed(0)}%` : numCofounders === 1 ? '100%' : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

export default EquityCalculatorModal;
