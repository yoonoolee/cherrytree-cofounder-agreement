import React from 'react';
import { ROLES } from './surveyConstants';

function Section2Cofounders({ formData, handleChange, isReadOnly, showValidation, project }) {
  // Calculate number of cofounders from collaborators (owner + collaborators)
  const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
  const calculatedCofounderCount = allCollaborators.length;

  const cofounders = formData.cofounders || [];

  // Automatically set cofounder count and initialize cofounders array
  React.useEffect(() => {
    if (calculatedCofounderCount > 0) {
      // Update cofounderCount if it's different
      if (parseInt(formData.cofounderCount) !== calculatedCofounderCount) {
        handleChange('cofounderCount', calculatedCofounderCount.toString());
      }

      // Initialize cofounders array if needed
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
  }, [calculatedCofounderCount]);

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
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Cofounder Info</h2>

      <p className="mb-16 leading-relaxed" style={{ color: '#808894' }}>
        Great company starts with great company. Whether it's just the two of you or if there's a dozen of you, this is the crew that decided to go for it. Names, roles, contact info, sure. But it's also a snapshot of the team before the world knows your name. Someday, this will be the "garage team" story you tell in interviews.
      </p>

      <div className="space-y-8">
        {/* Cofounder Forms */}
        {calculatedCofounderCount > 0 && (
          <div className="space-y-12">
            <p className="text-sm text-gray-700 font-medium -mb-6 bg-gray-100 p-4 rounded-lg">
              All cofounders must be added as collaborators to be included. Click the + button in the top right to add them.
            </p>
            {cofounders.map((cofounder, index) => (
              <div key={index} className="py-4">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Cofounder {String.fromCharCode(65 + index)}
                </h3>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-2">
                      Full Name
                      {showValidation && !cofounder.fullName && <span className="text-red-700 ml-0.5">*</span>}
                    </label>
                    <input
                      type="text"
                      value={cofounder.fullName || ''}
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
                      {showValidation && !cofounder.title && <span className="text-red-700 ml-0.5">*</span>}
                    </label>
                    <input
                      type="text"
                      value={cofounder.title || ''}
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
                      {showValidation && !cofounder.email && <span className="text-red-700 ml-0.5">*</span>}
                    </label>
                    <input
                      type="email"
                      value={cofounder.email || ''}
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
                      {showValidation && (!cofounder.roles || cofounder.roles.length === 0) && <span className="text-red-700 ml-0.5">*</span>}
                    </label>
                    <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
                    <div className="space-y-2">
                      {ROLES.map((role) => (
                        <label key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(cofounder.roles || []).includes(role)}
                            onChange={(e) => {
                              const currentRoles = cofounder.roles || [];
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

                    {(cofounder.roles || []).includes('Other') && (
                      <input
                        type="text"
                        value={cofounder.rolesOther || ''}
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

export default Section2Cofounders;
