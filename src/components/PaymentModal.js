import React, { useState } from 'react';
import { auth } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

const PLANS = {
  starter: {
    name: 'Starter',
    price: 200,
    priceId: process.env.REACT_APP_STRIPE_STARTER_PRICE_ID,
    description: 'For individuals to get started',
    features: [
      'Real-time collaboration',
      'Instant agreement from survey',
      'Unlimited collaborators'
    ]
  },
  pro: {
    name: 'Pro',
    price: 800,
    priceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID,
    description: 'Everything in Starter, plus',
    features: [
      'Advanced legal clauses',
      'Attorney review',
      'Cofounder coaching'
    ]
  }
};

function PaymentModal({ onClose, onSuccess, currentPlan = null, projectName: initialProjectName = '' }) {
  const [projectName, setProjectName] = useState(initialProjectName);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan === 'starter' ? 'pro' : 'starter');
  const isUpgrade = !!initialProjectName;
  const isMaxPlan = currentPlan === 'pro';
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
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to create a project');
      }

      const plan = PLANS[selectedPlan];

      // Create Stripe checkout session
      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

      // Use my.cherrytree.app for production, local origin for development
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://my.cherrytree.app'
        : window.location.origin;

      const result = await createCheckoutSession({
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
      // Don't log detailed errors in production for security
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating checkout session:', err);
      }
      setError(err.message || 'Failed to start payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200/50 max-w-2xl w-full p-8 relative z-[10000]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isMaxPlan ? "You're Already on the Highest Plan" : isUpgrade ? 'Upgrade Your Plan' : 'Start a New Cofounder Agreement'}
            </h2>
            {!isMaxPlan && (
              <p className="text-sm text-gray-600 mt-1">
                {isUpgrade ? 'Get access to advanced features' : 'Choose your plan and get started'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-950 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          {!isUpgrade && (
            <div className="mb-6">
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
          )}

          {/* Plan Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Plan
            </label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(PLANS).map(([key, plan]) => {
                const isDisabled = isMaxPlan || key === currentPlan;
                return (
                <button
                  key={key}
                  type="button"
                  onClick={() => !isDisabled && setSelectedPlan(key)}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg border-2 transition text-left ${
                    isDisabled
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : selectedPlan === key
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedPlan === key ? 'border-black' : 'border-gray-300'
                    }`}>
                      {selectedPlan === key && (
                        <div className="w-2 h-2 rounded-full bg-black"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-3">
                    {isUpgrade && currentPlan === 'starter' && key === 'pro' ? (
                      <>
                        <span className="line-through text-gray-400 text-lg mr-2">${plan.price}</span>
                        $600
                      </>
                    ) : (
                      `$${plan.price}`
                    )}
                  </p>
                  <ul className="space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-center">
                        <span className="mr-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
                );
              })}
            </div>
          </div>

          {isMaxPlan ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition"
            >
              Got it
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="button-shimmer w-full bg-[#000000] text-white py-3 rounded font-medium hover:bg-[#1a1a1a] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isUpgrade
                ? 'Upgrade your plan'
                : 'Continue to Payment'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;
