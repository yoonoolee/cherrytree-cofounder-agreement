import React, { useRef, useState } from 'react';
import EquityCalculatorModal from './EquityCalculatorModal';
import CustomSelect from './CustomSelect';
import './EquityCalculatorModal.css';
import { useUser } from '../contexts/UserContext';
import { useCollaborators } from '../hooks/useCollaborators';
import { FIELDS, COLLABORATOR_FIELDS } from '../config/surveySchema';

function SectionEquityAllocation({ formData, handleChange, isReadOnly, showValidation, project }) {
  const { currentUser } = useUser();
  const currentUserId = currentUser?.id;
  const { collaboratorIds, collaboratorsMap, isAdmin } = useCollaborators(project);
  const finalEquityRef = useRef(null);

  const [showModal, setShowModal] = useState(false);

  const getCollaboratorName = (userId) => {
    const collaborator = collaboratorsMap[userId];
    const accountName = [
      collaborator?.[COLLABORATOR_FIELDS.FIRST_NAME],
      collaborator?.[COLLABORATOR_FIELDS.LAST_NAME]
    ].filter(Boolean).join(' ');
    if (accountName) return accountName;
    const index = collaboratorIds.indexOf(userId);
    return `Cofounder ${String.fromCharCode(65 + index)}`;
  };

  const cofounderEntries = formData[FIELDS.COFOUNDERS] || [];
  const getCofounderName = (index) => {
    const fullName = cofounderEntries[index]?.[FIELDS.COFOUNDER_FULL_NAME];
    if (fullName && fullName.trim() !== '') return fullName.trim().split(' ')[0];
    return `Cofounder ${String.fromCharCode(65 + index)}`;
  };
  const cofounderNames = cofounderEntries.length
    ? cofounderEntries.map((_, i) => getCofounderName(i))
    : ['Cofounder A (you)', 'Cofounder B'];

  const equityEntries = formData[FIELDS.EQUITY_ENTRIES] || [];
  const drafts = formData[FIELDS.EQUITY_CALCULATOR_DRAFT] || {};
  const submitted = formData[FIELDS.EQUITY_CALCULATOR_SUBMITTED] || {};

  const handleDraftChange = (data) => {
    handleChange(FIELDS.EQUITY_CALCULATOR_DRAFT, { ...drafts, [currentUserId]: data });
  };

  const handleModalSubmit = (data) => {
    handleChange(FIELDS.EQUITY_CALCULATOR_DRAFT, { ...drafts, [currentUserId]: data });
    handleChange(FIELDS.EQUITY_CALCULATOR_SUBMITTED, {
      ...submitted,
      [currentUserId]: { ...data, submittedAt: new Date().toISOString() },
    });
  };

  const handleUseSplit = (percentages) => {
    const newEntries = cofounderNames.map((name, i) => ({
      [FIELDS.EQUITY_ENTRY_NAME]: name,
      [FIELDS.EQUITY_ENTRY_PERCENTAGE]: (percentages[i] || 0).toFixed(1),
    }));
    handleChange(FIELDS.EQUITY_ENTRIES, newEntries);
    handleChange(FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {});
    setShowModal(false);
    setTimeout(() => finalEquityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  };

  const otherCollaboratorIds = collaboratorIds.filter(id => id !== currentUserId);
  const otherSubmissions = {
    statusList: otherCollaboratorIds.map(id => ({ name: getCollaboratorName(id), submitted: !!submitted[id] })),
    entries: otherCollaboratorIds.filter(id => submitted[id]).map(id => ({
      name: getCollaboratorName(id),
      importance: submitted[id].importance,
      scores: submitted[id].scores,
    })),
  };

  const handleAddEquityEntry = () => {
    handleChange(FIELDS.EQUITY_ENTRIES, [...equityEntries, { [FIELDS.EQUITY_ENTRY_NAME]: '', [FIELDS.EQUITY_ENTRY_PERCENTAGE]: '' }]);
    handleChange(FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {});
  };

  const handleRemoveEquityEntry = (index) => {
    handleChange(FIELDS.EQUITY_ENTRIES, equityEntries.filter((_, i) => i !== index));
    handleChange(FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {});
  };

  const handleEquityEntryChange = (index, field, value) => {
    const newEntries = [...equityEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    handleChange(FIELDS.EQUITY_ENTRIES, newEntries);
    handleChange(FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {});
  };

  const handleAcknowledgmentChange = (userId, checked) => {
    handleChange(FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION, {
      ...(formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION] || {}),
      [userId]: checked,
    });
  };

  const totalEquity = equityEntries.reduce((sum, entry) => sum + (parseFloat(entry[FIELDS.EQUITY_ENTRY_PERCENTAGE]) || 0), 0);
  const allEntriesFilled = equityEntries.length > 0 && equityEntries.every(entry =>
    entry[FIELDS.EQUITY_ENTRY_NAME] && entry[FIELDS.EQUITY_ENTRY_PERCENTAGE] && entry[FIELDS.EQUITY_ENTRY_PERCENTAGE] !== ''
  );
  const equityValid = totalEquity <= 100.01;
  const canAcknowledge = allEntriesFilled && equityValid;
  const isOff = equityEntries.length > 0 && totalEquity > 100.01;
  const canAddMoreEntries = equityEntries.length < cofounderEntries.length;

  return (
    <div>
      <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '42px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.1, color: '#1a1a1a' }}>
        Equity Allocation
      </h2>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', lineHeight: 1.65, marginBottom: '12px' }}>
        A few years ago, two friends from Stanford launched a startup that took off fast. Within six months, they were in YC, had a long waiting list, and investors were calling.
      </p>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', lineHeight: 1.65, marginBottom: '12px' }}>
        But one cofounder started feeling like they were doing more. "I'm the CEO, I'm fundraising, I'm working longer hours." They tried to renegotiate the equity split from 50/50 to 70/30. The other cofounder felt blindsided, trust collapsed, and by Demo Day they'd split, both emotionally and legally.
      </p>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', lineHeight: 1.65, marginBottom: '32px' }}>
        Be very reluctant to change equity allocation once you've agreed. The #1 reason for cofounder breakups in the most recent YC batch was cofounders trying to revisit a settled split.
      </p>

      <div className="question-card expanded">
        <div className="card-row">
          <div className="card-question">Equity Calculator</div>
        </div>
        <div className="card-bottom"><div className="card-bottom-inner">
          <div className="card-hint">An optional 3-step tool to help you find your split before you commit to one.</div>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
            <button type="button" className="eq-open-btn" disabled={isReadOnly} onClick={() => setShowModal(true)}>
              Open Calculator
            </button>
            <button
              type="button"
              className="eq-skip-link"
              disabled={isReadOnly}
              onClick={() => finalEquityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Skip, I know my split
            </button>
          </div>

          <div className="eq-legal-wrap">
            <div className="eq-legal-inner">
              This equity calculator is for informational and planning purposes only. Using it does not grant, issue, vest,
              or transfer any equity, securities, or ownership interest of any kind. No equity exists unless and until it is
              formally approved and issued through proper corporate action (e.g., board approval) and documented via legally
              binding agreements (such as a stock purchase agreement, option grant, or equity incentive plan). You must
              complete the required legal and administrative steps for any equity to be valid.
            </div>
          </div>
        </div></div>
      </div>

      {showModal && (
        <EquityCalculatorModal
          cofounderNames={cofounderNames}
          myDraft={drafts[currentUserId]}
          otherSubmissions={otherSubmissions}
          onDraftChange={handleDraftChange}
          onSubmit={handleModalSubmit}
          onUseSplit={handleUseSplit}
          onClose={() => setShowModal(false)}
        />
      )}

      <div ref={finalEquityRef} className="question-card expanded" style={{ marginTop: 12 }}>
        <div className="card-row">
          <div className="card-question">Final Equity Allocation</div>
        </div>
        <div className="card-bottom"><div className="card-bottom-inner">
          <div className="card-hint">This is the number that goes in your agreement.</div>

          <div style={{ marginTop: 20 }}>
            {equityEntries.length > 0 && (
              <div className="eq-entry-header-row">
                <span>Name</span>
                <span>Equity %</span>
                <span />
              </div>
            )}

            {equityEntries.length === 0 ? (
              <p className="text-gray-500 text-sm mb-6">Click "+ Add Cofounder" to add equity allocations</p>
            ) : (
              <div id="eq-entry-list">
                {equityEntries.map((entry, index) => (
                  <div key={index} className="eq-entry-row" style={{ overflow: 'visible', position: 'relative', zIndex: equityEntries.length - index }}>
                    <CustomSelect
                      className="eq-entry-name"
                      value={entry[FIELDS.EQUITY_ENTRY_NAME] || ''}
                      onChange={(value) => handleEquityEntryChange(index, FIELDS.EQUITY_ENTRY_NAME, value)}
                      options={cofounderEntries
                        .filter(cf => cf[FIELDS.COFOUNDER_FULL_NAME])
                        .filter(cf => !equityEntries.some((e, i) => i !== index && e[FIELDS.EQUITY_ENTRY_NAME] === cf[FIELDS.COFOUNDER_FULL_NAME]))
                        .map(cf => ({ value: cf[FIELDS.COFOUNDER_FULL_NAME], label: cf[FIELDS.COFOUNDER_FULL_NAME] }))}
                      placeholder="Select a cofounder"
                      disabled={isReadOnly}
                    />
                    <div className="eq-pct-wrap">
                      <button
                        type="button"
                        className="eq-pct-btn"
                        disabled={isReadOnly}
                        onClick={() => {
                          const current = parseFloat(entry[FIELDS.EQUITY_ENTRY_PERCENTAGE]) || 0;
                          handleEquityEntryChange(index, FIELDS.EQUITY_ENTRY_PERCENTAGE, Math.max(0, current - 0.5).toFixed(1));
                        }}
                      >
                        −
                      </button>
                      <input
                        type="number" min="0" max="100" step="0.5"
                        className="card-input eq-entry-pct"
                        value={entry[FIELDS.EQUITY_ENTRY_PERCENTAGE] ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                            handleEquityEntryChange(index, FIELDS.EQUITY_ENTRY_PERCENTAGE, value);
                          }
                        }}
                        disabled={isReadOnly}
                        placeholder="25"
                      />
                      <button
                        type="button"
                        className="eq-pct-btn"
                        disabled={isReadOnly}
                        onClick={() => {
                          const current = parseFloat(entry[FIELDS.EQUITY_ENTRY_PERCENTAGE]) || 0;
                          handleEquityEntryChange(index, FIELDS.EQUITY_ENTRY_PERCENTAGE, Math.min(100, current + 0.5).toFixed(1));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button type="button" className="eq-entry-remove" onClick={() => handleRemoveEquityEntry(index)} disabled={isReadOnly}>
                      Remove
                    </button>
                    {showValidation && (!entry[FIELDS.EQUITY_ENTRY_NAME] || !entry[FIELDS.EQUITY_ENTRY_PERCENTAGE]) && (
                      <span className="text-red-700 text-xs eq-entry-validation">* Name and equity % required</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {equityEntries.length > 0 && (
              <>
                <div className={`eq-total-row${isOff ? ' error' : ''}`}>Total Equity: {totalEquity.toFixed(2)}%</div>
                {isOff && (
                  <div className="eq-total-hint" style={{ display: 'block' }}>
                    Total equity exceeds 100%. Please adjust.
                  </div>
                )}
              </>
            )}

            <button type="button" className="eq-add-btn" onClick={handleAddEquityEntry} disabled={isReadOnly || !canAddMoreEntries}>
              + Add Cofounder
            </button>
            {!canAddMoreEntries && (
              <span style={{ fontSize: '11px', color: '#888', marginLeft: '10px' }}>
                {cofounderEntries.length === 0 ? 'Add cofounders in the Cofounder Info section first.' : 'All cofounders added.'}
              </span>
            )}

            <div style={{ marginTop: 10 }}>
              {collaboratorIds.map((userId) => {
                const isApproved = formData[FIELDS.ACKNOWLEDGE_EQUITY_ALLOCATION]?.[userId] || false;
                const isCurrentUser = userId === currentUserId;
                const clickable = !isReadOnly && isCurrentUser && canAcknowledge;
                return (
                  <div
                    key={userId}
                    className={`eq-sign-row${isApproved ? ' signed' : ''}${!clickable ? ' disabled' : ''}`}
                    onClick={() => clickable && handleAcknowledgmentChange(userId, !isApproved)}
                  >
                    <div className="eq-sign-check"><span className="eq-sign-checkmark">✓</span></div>
                    <div className="eq-sign-label">
                      I acknowledge and accept this equity allocation: <span className="eq-sign-name">{getCollaboratorName(userId)}</span>
                      {isAdmin(userId) && <span style={{ marginLeft: 6, fontSize: 11, color: '#aaa' }}>(Admin)</span>}
                      {showValidation && !isApproved && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div></div>
      </div>
    </div>
  );
}

export default SectionEquityAllocation;
