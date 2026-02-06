import React from 'react';
import { ROLES, FIELDS } from '../config/surveySchema';
import { useCollaborators } from '../hooks/useCollaborators';

function SectionCofounders({ formData, handleChange, isReadOnly, showValidation, project }) {
  // Only used for max count cap
  const { collaboratorIds } = useCollaborators(project);
  const maxCofounders = collaboratorIds.length;

  const cofounders = formData[FIELDS.COFOUNDERS] || [];
  const canAddMore = cofounders.length < maxCofounders;
  const hasExtraCofounders = cofounders.length > maxCofounders;

  const handleAddCofounder = () => {
    if (!canAddMore) return;
    const newCofounders = [...cofounders, {
      [FIELDS.COFOUNDER_ID]: crypto.randomUUID(),
      [FIELDS.COFOUNDER_FULL_NAME]: '',
      [FIELDS.COFOUNDER_TITLE]: '',
      [FIELDS.COFOUNDER_EMAIL]: '',
      [FIELDS.COFOUNDER_ROLES]: [],
      [FIELDS.COFOUNDER_ROLES_OTHER]: ''
    }];
    handleChange(FIELDS.COFOUNDERS, newCofounders);
    handleChange(FIELDS.COFOUNDER_COUNT, newCofounders.length.toString());
  };

  const handleRemoveCofounder = (index) => {
    const newCofounders = cofounders.filter((_, i) => i !== index);
    handleChange(FIELDS.COFOUNDERS, newCofounders);
    handleChange(FIELDS.COFOUNDER_COUNT, newCofounders.length.toString());
  };

  const handleCofounderChange = (index, field, value) => {
    const newCofounders = [...cofounders];
    newCofounders[index] = {
      ...newCofounders[index],
      [field]: value
    };
    handleChange(FIELDS.COFOUNDERS, newCofounders);
  };

  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Cofounder Info</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Whether it's just the two of you or if there's a dozen of you, this is the crew that decided to go for it. Names, roles, contact info, sure. But it's also a snapshot of the team before the world knows your name. Someday, this will be the "garage team" story you tell in interviews.
      </p>

      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-base font-medium text-gray-900">
              Cofounders
            </label>
            {hasExtraCofounders ? (
              <p className="text-xs text-red-500 mt-1 validation-error">
                Please remove cofounders deleted from the project.
              </p>
            ) : !canAddMore && cofounders.length > 0 ? (
              <p className="text-xs text-gray-500 mt-1">
                All collaborators have been added
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleAddCofounder}
            disabled={isReadOnly || !canAddMore}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            + Add Cofounder
          </button>
        </div>

        {cofounders.length === 0 ? (
          <p className="text-gray-500 text-sm">Click "+ Add Cofounder" to add entries</p>
        ) : (
          <div className="space-y-12">
            {cofounders.map((cofounder, index) => (
                <div key={index} className="py-4">
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveCofounder(index)}
                      disabled={isReadOnly}
                      className="text-red-500 hover:text-red-700 text-sm disabled:text-gray-400"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-base font-medium text-gray-900 mb-2">
                        Full Name
                        {showValidation && !cofounder[FIELDS.COFOUNDER_FULL_NAME] && <span className="text-red-700 ml-0.5">*</span>}
                      </label>
                      <input
                        type="text"
                        value={cofounder[FIELDS.COFOUNDER_FULL_NAME] || ''}
                        onChange={(e) => handleCofounderChange(index, FIELDS.COFOUNDER_FULL_NAME, e.target.value)}
                        disabled={isReadOnly}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Tim He"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-base font-medium text-gray-900 mb-2">
                        Title
                        {showValidation && !cofounder[FIELDS.COFOUNDER_TITLE] && <span className="text-red-700 ml-0.5">*</span>}
                      </label>
                      <input
                        type="text"
                        value={cofounder[FIELDS.COFOUNDER_TITLE] || ''}
                        onChange={(e) => handleCofounderChange(index, FIELDS.COFOUNDER_TITLE, e.target.value)}
                        disabled={isReadOnly}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Chief Executive Officer"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-base font-medium text-gray-900 mb-2">
                        Email
                        {showValidation && !cofounder[FIELDS.COFOUNDER_EMAIL] && <span className="text-red-700 ml-0.5">*</span>}
                      </label>
                      <input
                        type="email"
                        value={cofounder[FIELDS.COFOUNDER_EMAIL] || ''}
                        onChange={(e) => handleCofounderChange(index, FIELDS.COFOUNDER_EMAIL, e.target.value)}
                        disabled={isReadOnly}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
                        placeholder="tim@cherrytree.app"
                      />
                    </div>

                    {/* Roles & Responsibilities */}
                    <div>
                      <label className="block text-base font-medium text-gray-900 mb-2">
                        Roles & Responsibilities
                        {showValidation && (!cofounder[FIELDS.COFOUNDER_ROLES] || cofounder[FIELDS.COFOUNDER_ROLES].length === 0) && <span className="text-red-700 ml-0.5">*</span>}
                      </label>
                      <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
                      <div className="space-y-2">
                        {ROLES.map((role) => (
                          <label key={role} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(cofounder[FIELDS.COFOUNDER_ROLES] || []).includes(role)}
                              onChange={(e) => {
                                const currentRoles = cofounder[FIELDS.COFOUNDER_ROLES] || [];
                                const newRoles = e.target.checked
                                  ? [...currentRoles, role]
                                  : currentRoles.filter(r => r !== role);
                                if (role === 'Other' && !e.target.checked) {
                                  // Update both fields at once to avoid stale state
                                  const newCofounders = [...cofounders];
                                  newCofounders[index] = {
                                    ...newCofounders[index],
                                    [FIELDS.COFOUNDER_ROLES]: newRoles,
                                    [FIELDS.COFOUNDER_ROLES_OTHER]: ''
                                  };
                                  handleChange(FIELDS.COFOUNDERS, newCofounders);
                                } else {
                                  handleCofounderChange(index, FIELDS.COFOUNDER_ROLES, newRoles);
                                }
                              }}
                              disabled={isReadOnly}
                              className="mr-3"
                            />
                            <span className="text-gray-700">{role}</span>
                          </label>
                        ))}
                      </div>

                      {(cofounder[FIELDS.COFOUNDER_ROLES] || []).includes('Other') && (
                        <input
                          type="text"
                          value={cofounder[FIELDS.COFOUNDER_ROLES_OTHER] || ''}
                          onChange={(e) => handleCofounderChange(index, FIELDS.COFOUNDER_ROLES_OTHER, e.target.value)}
                          disabled={isReadOnly}
                          className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
                          placeholder="Please specify"
                        />
                      )}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SectionCofounders;
