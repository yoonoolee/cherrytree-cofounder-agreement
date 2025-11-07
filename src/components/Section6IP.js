import React from 'react';
import { auth } from '../firebase';
import Tooltip from './Tooltip';

function Section6IP({ formData, handleChange, isReadOnly, project, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">IP & Ownership of Work</h2>
      <p className="text-gray-600 mb-8">Intellectual property assignment and ownership</p>


      <div className="space-y-12">
        {/* Has Pre-Existing IP */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Has any cofounder created code, designs, or other assets before the company was formed that will now be used in the business?
            <Tooltip text="Nail down ownership now, or risk ugly debates later over who really owns what once the company takes off." />
            {showValidation && !formData.hasPreExistingIP && <span className="text-red-700 ml-0.5 validation-error">*</span>}
          </label>
          <div className="space-y-2">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="hasPreExistingIP"
                  value={option}
                  checked={formData.hasPreExistingIP === option}
                  onChange={(e) => handleChange('hasPreExistingIP', e.target.value)}
                  disabled={isReadOnly}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Acknowledge IP Assignment */}
        {formData.hasPreExistingIP === 'Yes' && (
          <div>
            <label className="block text-base font-medium text-gray-900 mb-2">
              {(() => {
                const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
                const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgeIPAssignment?.[email]);
                return (
                  <>
                    Do you understand that such IP will be assigned to the company?
                    {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                  </>
                );
              })()}
            </label>
            <div className="space-y-2">
              {(() => {
                const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
                const approvals = formData.acknowledgeIPAssignment || {};
                const currentUserEmail = auth.currentUser?.email;

                return allCollaborators.map((email, index) => {
                  const isApproved = approvals[email] || false;
                  const isCurrentUser = email === currentUserEmail;

                  return (
                    <label key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isApproved}
                        onChange={(e) => {
                          const newApprovals = { ...approvals, [email]: e.target.checked };
                          handleChange('acknowledgeIPAssignment', newApprovals);
                        }}
                        disabled={isReadOnly || !isCurrentUser}
                        className="mr-3"
                      />
                      <span className="text-gray-700">
                        {email}
                        {email === project?.ownerEmail && <span className="ml-2 text-xs text-gray-500">(Owner)</span>}
                        {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                        
                      </span>
                    </label>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Acknowledge IP Ownership */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            {(() => {
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const allAcknowledged = allCollaborators.length > 0 && allCollaborators.every(email => formData.acknowledgeIPOwnership?.[email]);
              return (
                <>
                  Each Cofounder agrees that all inventions, discoveries, designs, developments, improvements, processes, works of authorship, trade secrets, and other intellectual property (collectively, "IP") conceived, created, developed, or reduced to practice by the Cofounder, either alone or with others, in the course of their work for the Company or using the Company's resources, shall be the sole and exclusive property of the Company.
                  {showValidation && !allAcknowledged && <span className="text-red-700 ml-0.5 validation-error">*</span>}
                </>
              );
            })()}
          </label>
          <div className="space-y-2">
            {(() => {
              const allCollaborators = [...new Set([project?.ownerEmail, ...(project?.collaborators || [])])].filter(Boolean);
              const approvals = formData.acknowledgeIPOwnership || {};
              const currentUserEmail = auth.currentUser?.email;

              return allCollaborators.map((email, index) => {
                const isApproved = approvals[email] || false;
                const isCurrentUser = email === currentUserEmail;

                return (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => {
                        const newApprovals = { ...approvals, [email]: e.target.checked };
                        handleChange('acknowledgeIPOwnership', newApprovals);
                      }}
                      disabled={isReadOnly || !isCurrentUser}
                      className="mr-3"
                    />
                    <span className="text-gray-700">
                      {email}
                      {email === project?.ownerEmail && <span className="ml-2 text-xs text-gray-500">(Owner)</span>}
                      {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                      
                    </span>
                  </label>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Section6IP;
