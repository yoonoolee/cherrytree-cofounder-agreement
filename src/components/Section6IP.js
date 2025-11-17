import React from 'react';
import { auth } from '../firebase';
import Tooltip from './Tooltip';

function Section6IP({ formData, handleChange, isReadOnly, project, showValidation }) {
  return (
    <div>
      <h2 className="text-3xl font-medium text-gray-800 mb-6">IP & Ownership of Work</h2>

      <p className="mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
        In 2013, Reggie Brown sued his Snapchat cofounders, Evan Spiegel and Bobby Murphy. He claimed they stole his idea: an app where messages vanish after being sent. Brown said he not only conceived the concept but also shook hands with Spiegel to serve as CMO. He claimed credit for the original name "Picaboo," the ghost logo, and even a draft patent for the disappearing-message technology.
      </p>
      <p className="mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
        Not long after they started, the partnership unraveled. Brown alleged he was locked out of company accounts and cut off all communication. One day a cofounder, the next day erased entirely. After a long legal battle, Snapchat settled, paying Brown $157 million.
      </p>
      <p className="mb-16 leading-relaxed" style={{ color: '#6B7280' }}>
        Without being specific about IP, even college buddies can turn on each other.
      </p>

      <div className="space-y-12">
        {/* Has Pre-Existing IP */}
        <div>
          <label className="block text-base font-medium text-gray-900 mb-2">
            Has any cofounder created code, designs, or other assets before the company was formed that will now be used in the business?
            {showValidation && !formData.hasPreExistingIP && <span className="text-red-700 ml-0.5 validation-error">*</span>}
            <Tooltip text="Nail down ownership now, or risk ugly debates later over who really owns what once the company takes off." />
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
                        {isCurrentUser && <span className="ml-2 text-xs text-red-950">(You)</span>}
                        
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
                      {isCurrentUser && <span className="ml-2 text-xs text-red-950">(You)</span>}
                      
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
