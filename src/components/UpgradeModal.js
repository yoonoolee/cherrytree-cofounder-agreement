import React from 'react';
import { PRICING_PLANS } from '../constants/pricing';
import ProWaitlistForm from './ProWaitlistForm';

function UpgradeModal({ onClose, currentPlan = 'starter' }) {
  // Only show Starter and Pro (not Enterprise) in upgrade modal
  const upgradePlans = PRICING_PLANS.filter(plan => plan.name !== 'Enterprise');

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200/50 max-w-4xl w-full p-4 md:p-8 relative z-[10000] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6 md:mb-8">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Upgrade Your Plan
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Choose the plan that's right for your team
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Pricing Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {upgradePlans.map((plan) => {
            const isCurrentPlan = currentPlan && currentPlan.toLowerCase() === plan.name.toLowerCase();
            const isProPlan = plan.name === 'Pro';

            return (
              <div
                key={plan.name}
                className={`bg-white p-6 md:p-8 rounded-lg flex flex-col relative ${
                  plan.featured
                    ? 'ring-2 ring-gray-700'
                    : 'border border-gray-400'
                }`}
              >
                {/* Coming Soon Badge for Pro */}
                {isProPlan && (
                  <div className="absolute -top-2 -right-2 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                    Coming Soon
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-900 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Current plan
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-normal mb-2 text-[#716B6B]">{plan.name}</h3>
                <div className="text-4xl font-bold mb-2">{plan.price}</div>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Email Waitlist Form for Pro Plan (under description) */}
                {isProPlan && (
                  <div className="mb-6">
                    <ProWaitlistForm source="upgrade_modal" />
                  </div>
                )}

                {/* Features List */}
                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-[#716B6B]">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
