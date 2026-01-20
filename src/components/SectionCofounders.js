import React from 'react';
import { ROLES } from '../config/surveySchema';
import { FIELDS } from '../config/surveySchema';

function SectionCofounders({ formData, handleChange, isReadOnly, showValidation, project }) {
  // Get cofounder count from collaborators map
  const calculatedCofounderCount = Object.keys(project?.collaborators || {}).length;

  const cofounders = formData[FIELDS.COFOUNDERS] || [];

  // Automatically set cofounder count and initialize cofounders array
  React.useEffect(() => {
    if (calculatedCofounderCount > 0) {
      // Update cofounderCount if it's different
      if (parseInt(formData[FIELDS.COFOUNDER_COUNT]) !== calculatedCofounderCount) {
        handleChange('cofounderCount', calculatedCofounderCount.toString());
      }

      // Initialize cofounders array ONLY if length doesn't match
      // Don't reinitialize if it already has the correct length (preserves user input)
      if (cofounders.length !== calculatedCofounderCount) {
        const newCofounders = Array.from({ length: calculatedCofounderCount }, (_, i) => {
          return cofounders[i] || {
            fullName: '',
            title: '',
            email: '',
            roles: [],
            rolesOther: ''
          };
        });
        handleChange('cofounders', newCofounders);
      }
    }
  }, [calculatedCofounderCount, formData[FIELDS.COFOUNDER_COUNT], cofounders.length, handleChange]);

  const handleCofounderChange = (index, field, value) => {
    const newCofounders = [...cofounders];
    newCofounders[index] = {
      ...newCofounders[index],
      [field]: value
    };
    handleChange('cofounders', newCofounders);
  };

  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">Cofounder Info</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Whether it's just the two of you or if there's a dozen of you, this is the crew that decided to go for it. Names, roles, contact info, sure. But it's also a snapshot of the team before the world knows your name. Someday, this will be the "garage team" story you tell in interviews.
      </p>

      <div className="space-y-8">
        {/* Cofounder Forms */}
        {calculatedCofounderCount > 0 && (
          <div className="space-y-12">
            <div className="text-sm text-gray-700 font-medium -mb-6 bg-gray-100 p-4 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>All cofounders must be added as collaborators to be included. Click the + button in the top right to add them.</span>
            </div>
            {cofounders.map((cofounder, index) => (
              <div key={index} className="py-4">
                <h3 className="text-xl font-medium text-gray-800 mb-6">
                  Cofounder {String.fromCharCode(65 + index)}
                </h3>

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
                      onChange={(e) => handleCofounderChange(index, 'fullName', e.target.value)}
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
                      onChange={(e) => handleCofounderChange(index, 'title', e.target.value)}
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
                      onChange={(e) => handleCofounderChange(index, 'email', e.target.value)}
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
                              handleCofounderChange(index, 'roles', newRoles);
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
                        onChange={(e) => handleCofounderChange(index, 'rolesOther', e.target.value)}
                        disabled={isReadOnly}
                        className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-950 focus:border-transparent disabled:bg-gray-100"
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
