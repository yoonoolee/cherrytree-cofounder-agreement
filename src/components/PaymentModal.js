import React, { useState } from 'react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '@clerk/clerk-react';
import { PRICING_PLANS } from '../constants/pricing';
import ProWaitlistForm from './ProWaitlistForm';

// Filter to only Starter and Pro for payment modal
const PLANS = PRICING_PLANS.filter(plan => plan.key === 'starter' || plan.key === 'pro').reduce((acc, plan) => {
  acc[plan.key] = plan;
  return acc;
}, {});

function PaymentModal({ onClose, onSuccess }) {
  const { currentUser, loading: userLoading } = useUser();
  const { getToken } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWiggling, setIsWiggling] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = projectName.trim();

    // Validate project name
    if (!trimmedName) {
      setIsWiggling(true);
      setTimeout(() => setIsWiggling(false), 500);
      return;
    }

    if (trimmedName.length < 2) {
      setError('Company name must be at least 2 characters');
      setIsWiggling(true);
      setTimeout(() => setIsWiggling(false), 500);
      return;
    }

    if (trimmedName.length > 100) {
      setError('Company name must be less than 100 characters');
      return;
    }

    // Prevent script injection attempts
    if (/<|>|javascript:|on\w+=/i.test(trimmedName)) {
      setError('Company name contains invalid characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (userLoading) {
        throw new Error('Please wait while we load your account...');
      }

      if (!currentUser) {
        throw new Error('You must be logged in to create a project');
      }

      const plan = PLANS[selectedPlan];

      // Get Clerk session token
      const sessionToken = await getToken();
      if (!sessionToken) {
        throw new Error('Unable to verify authentication. Please try logging in again.');
      }

      // Create Stripe checkout session
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

      // Use environment-specific app URL
      const baseUrl = process.env.REACT_APP_APP_URL || window.location.origin;

      const result = await createCheckoutSession({
        sessionToken,
        priceId: plan.priceId,
        plan: selectedPlan,
        projectName: trimmedName,
        successUrl: `${baseUrl}/dashboard?payment=success`,
        cancelUrl: `${baseUrl}/dashboard?payment=cancelled`
      });

      // Redirect to Stripe checkout
      if (result.data.url) {
        // Save timestamp to detect new project after payment
        sessionStorage.setItem('paymentStartTime', Date.now().toString());
        window.location.href = result.data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }

    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Failed to start payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-[9999]" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200/50 max-w-2xl w-full p-4 md:p-8 relative z-[10000] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4 md:mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">
              Start a New Cofounder Agreement
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Choose your plan and get started
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl flex-shrink-0"
          >
            ×
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-950 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4 md:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={`w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:border-black focus:ring-0 bg-transparent text-gray-900 ${isWiggling ? 'animate-wiggle' : ''}`}
              placeholder="Enter company name"
            />
          </div>

          {/* Plan Selection */}
          <div className="mb-4 md:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Plan
            </label>
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 items-stretch">
              {Object.entries(PLANS).map(([key, plan]) => {
                const isProPlan = key === 'pro';
                const isDisabled = isProPlan;

                const cardContent = (
                  <>
                    {!isProPlan && (
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mb-2 ${
                        selectedPlan === key ? 'border-black' : 'border-gray-300'
                      }`}>
                        {selectedPlan === key && (
                          <div className="w-2 h-2 rounded-full bg-black"></div>
                        )}
                      </div>
                    )}
                    <div className="mb-2">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
                      {plan.price}
                    </p>
                    <ul className="space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-center">
                          <span className="mr-1">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {isProPlan && (
                      <div className="mt-3 pt-3 border-t border-gray-200 md:mt-4 md:pt-4">
                        <ProWaitlistForm source="payment_modal" />
                      </div>
                    )}
                  </>
                );

                return (
                <div key={key} className="relative">
                  {/* Coming Soon Badge for Pro */}
                  {isProPlan && (
                    <div className="absolute -top-2 -right-2 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                      Coming Soon
                    </div>
                  )}
                  {isProPlan ? (
                    <div className="p-3 md:p-4 rounded-lg border-2 transition text-left w-full h-full border-gray-200 bg-gray-50 cursor-not-allowed">
                      {cardContent}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !isDisabled && setSelectedPlan(key)}
                      disabled={isDisabled}
                      className={`p-3 md:p-4 rounded-lg border-2 transition text-left w-full h-full ${
                        isDisabled
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : selectedPlan === key
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {cardContent}
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button-shimmer w-full bg-[#000000] text-white py-2.5 md:py-3 rounded text-sm md:text-base font-medium hover:bg-[#1a1a1a] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;
