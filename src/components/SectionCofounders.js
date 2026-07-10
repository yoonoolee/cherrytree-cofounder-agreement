import React, { useState } from 'react';
import { ROLES, FIELDS } from '../config/surveySchema';
import { useCollaborators } from '../hooks/useCollaborators';

const EMPTY_CF = { fullName: '', title: '', email: '', roles: [], rolesOther: '' };

function CofounderForm({ values, onChange, onSubmit, onCancel, onRemove, submitLabel, isReadOnly }) {
  return (
    <div className="cf-form-fields">
      <div className="cf-inline-form-grid">
        <div>
          <span className="cf-field-label">Full Name</span>
          <input type="text" value={values.fullName} onChange={e => onChange('fullName', e.target.value)} disabled={isReadOnly} placeholder="First Last" />
        </div>
        <div>
          <span className="cf-field-label">Title</span>
          <input type="text" value={values.title} onChange={e => onChange('title', e.target.value)} disabled={isReadOnly} placeholder="Chief Executive Officer" />
        </div>
        <div>
          <span className="cf-field-label">Email</span>
          <input type="email" value={values.email} onChange={e => onChange('email', e.target.value)} disabled={isReadOnly} placeholder="first@company.com" />
        </div>
      </div>

      <div style={{ marginTop: '22px' }}>
        <span className="cf-field-label" style={{ marginTop: 0 }}>Roles and Responsibilities</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {ROLES.map(role => (
            <label key={role} className="card-checkbox-option">
              <input
                type="checkbox"
                checked={(values.roles || []).includes(role)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...(values.roles || []), role]
                    : (values.roles || []).filter(r => r !== role);
                  onChange('roles', next);
                  if (role === 'Other' && !e.target.checked) onChange('rolesOther', '');
                }}
                disabled={isReadOnly}
              />
              <span className="checkbox-box" />
              {role}
            </label>
          ))}
        </div>
        {(values.roles || []).includes('Other') && (
          <input type="text" value={values.rolesOther || ''} onChange={e => onChange('rolesOther', e.target.value)} disabled={isReadOnly} placeholder="Please specify" style={{ marginTop: '8px' }} />
        )}
      </div>

      <div className="cf-form-footer">
        {onRemove && <button className="cf-remove-btn" type="button" onClick={onRemove} disabled={isReadOnly}>Remove</button>}
        <button className="cf-cancel-btn" type="button" onClick={onCancel}>Cancel</button>
        <button className="cf-submit-btn" type="button" onClick={onSubmit} disabled={isReadOnly}>{submitLabel}</button>
      </div>
    </div>
  );
}

function SectionCofounders({ formData, handleChange, isReadOnly, showValidation, project }) {
  const { collaboratorIds } = useCollaborators(project);
  const maxCofounders = collaboratorIds.length;
  const cofounders = formData[FIELDS.COFOUNDERS] || [];
  const canAddMore = cofounders.length < maxCofounders;
  const hasExtraCofounders = cofounders.length > maxCofounders;

  const [expandedIndex, setExpandedIndex] = useState(-1);
  const [addingNew, setAddingNew] = useState(false);
  const [newCf, setNewCf] = useState(EMPTY_CF);

  const commitCofounderChange = (index, field, value) => {
    const updated = [...cofounders];
    const fieldMap = { fullName: FIELDS.COFOUNDER_FULL_NAME, title: FIELDS.COFOUNDER_TITLE, email: FIELDS.COFOUNDER_EMAIL, roles: FIELDS.COFOUNDER_ROLES, rolesOther: FIELDS.COFOUNDER_ROLES_OTHER };
    updated[index] = { ...updated[index], [fieldMap[field]]: value };
    handleChange(FIELDS.COFOUNDERS, updated);
  };

  const handleRemoveCofounder = (index) => {
    const next = cofounders.filter((_, i) => i !== index);
    handleChange(FIELDS.COFOUNDERS, next);
    handleChange(FIELDS.COFOUNDER_COUNT, next.length.toString());
    setExpandedIndex(-1);
  };

  const handleAddSubmit = () => {
    const next = [...cofounders, {
      [FIELDS.COFOUNDER_ID]: crypto.randomUUID(),
      [FIELDS.COFOUNDER_FULL_NAME]: newCf.fullName,
      [FIELDS.COFOUNDER_TITLE]: newCf.title,
      [FIELDS.COFOUNDER_EMAIL]: newCf.email,
      [FIELDS.COFOUNDER_ROLES]: newCf.roles,
      [FIELDS.COFOUNDER_ROLES_OTHER]: newCf.rolesOther,
    }];
    handleChange(FIELDS.COFOUNDERS, next);
    handleChange(FIELDS.COFOUNDER_COUNT, next.length.toString());
    setNewCf(EMPTY_CF);
    setAddingNew(false);
  };

  const getDisplayValues = (cf) => ({
    fullName: cf[FIELDS.COFOUNDER_FULL_NAME] || '',
    title: cf[FIELDS.COFOUNDER_TITLE] || '',
    email: cf[FIELDS.COFOUNDER_EMAIL] || '',
    roles: cf[FIELDS.COFOUNDER_ROLES] || [],
    rolesOther: cf[FIELDS.COFOUNDER_ROLES_OTHER] || '',
  });

  const isAnswered = (cf) =>
    !!(cf[FIELDS.COFOUNDER_FULL_NAME] && cf[FIELDS.COFOUNDER_TITLE] && cf[FIELDS.COFOUNDER_EMAIL] && (cf[FIELDS.COFOUNDER_ROLES] || []).length);

  const getCofounderPreview = (values) => {
    const rolesList = values.roles.map(r => (r === 'Other' && values.rolesOther ? values.rolesOther : r));
    return [values.title, values.email, rolesList.join(', ')].filter(Boolean).join('\n');
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '42px', fontWeight: 400, letterSpacing: '-0.5px', marginBottom: '14px', lineHeight: 1.1, color: '#1a1a1a' }}>
        Cofounder Information
      </h2>
      <p style={{ fontSize: '14px', fontWeight: 200, color: '#555', lineHeight: 1.65, marginBottom: '32px' }}>
        Whether it's just the two of you or if there's a dozen of you, this is the crew that decided to go for it. Names, roles, contact info, sure. But it's also a snapshot of the team before the world knows your name. Someday, this will be the "garage team" story you tell in interviews.
      </p>

      {hasExtraCofounders && (
        <p className="text-red-500 text-xs mb-4 validation-error">Please remove cofounders deleted from the project.</p>
      )}

      {/* One card per cofounder */}
      {cofounders.map((cf, index) => {
        const isExpanded = expandedIndex === index;
        const answered = isAnswered(cf);
        const values = getDisplayValues(cf);
        const missing = showValidation && !answered;
        return (
          <div
            key={cf[FIELDS.COFOUNDER_ID] || index}
            className={`question-card${isExpanded ? ' expanded' : ''}${answered ? ' answered' : ''}`}
            style={{ marginBottom: '8px' }}
          >
            <div
              className="card-row"
              onClick={() => { if (isExpanded) { setExpandedIndex(-1); } else { setExpandedIndex(index); setAddingNew(false); } }}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-question">
                {cf[FIELDS.COFOUNDER_FULL_NAME] || 'New Cofounder'}
                {missing && <span style={{ color: '#b97070', marginLeft: '6px', fontSize: '14px' }}>*</span>}
              </div>
              {getCofounderPreview(values) && (
                <span className="card-answer-preview">{getCofounderPreview(values)}</span>
              )}
            </div>

            <div className="card-bottom">
              <div className="card-bottom-inner">
                <CofounderForm
                  values={values}
                  onChange={(field, value) => commitCofounderChange(index, field, value)}
                  onSubmit={() => setExpandedIndex(-1)}
                  onCancel={() => setExpandedIndex(-1)}
                  onRemove={!isReadOnly ? () => handleRemoveCofounder(index) : null}
                  submitLabel="Done"
                  isReadOnly={isReadOnly}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Add new cofounder card */}
      {addingNew && (
        <div
          className="question-card expanded"
          style={{ marginBottom: '8px', cursor: 'default' }}
        >
          <div className="card-row">
            <div className="card-question">New Cofounder</div>
          </div>
          <div className="card-bottom">
            <div className="card-bottom-inner">
              <CofounderForm
                values={newCf}
                onChange={(field, value) => setNewCf(prev => ({ ...prev, [field]: value }))}
                onSubmit={handleAddSubmit}
                onCancel={() => { setAddingNew(false); setNewCf(EMPTY_CF); }}
                submitLabel="Add Cofounder"
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      {!isReadOnly && canAddMore && !addingNew && (
        <button
          type="button"
          onClick={() => { setAddingNew(true); setExpandedIndex(-1); }}
          style={{
            marginTop: '8px',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 300, color: '#888',
            fontFamily: 'Outfit, sans-serif', padding: 0, transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a1a1a'}
          onMouseLeave={e => e.currentTarget.style.color = '#888'}
        >
          Add Cofounder
          <span className="cf-add-icon">+</span>
        </button>
      )}

      {cofounders.length === 0 && !addingNew && (
        <p style={{ fontSize: '13px', fontWeight: 300, color: '#aaa', marginTop: '8px' }}>
          Click "Add Cofounder" to get started.
        </p>
      )}
    </div>
  );
}

export default SectionCofounders;
