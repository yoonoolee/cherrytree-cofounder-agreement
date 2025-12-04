import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
      'Attorney review',
      'Cofounder coaching',
      'Priority support'
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
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

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

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setWaitlistError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!waitlistEmail.trim() || !emailRegex.test(waitlistEmail)) {
      setWaitlistError('Please enter a valid email address');
      return;
    }

    setWaitlistLoading(true);

    try {
      // Save to Firestore
      await addDoc(collection(db, 'proWaitlist'), {
        email: waitlistEmail.toLowerCase().trim(),
        timestamp: serverTimestamp(),
        source: 'payment_modal'
      });

      setWaitlistSuccess(true);
      setWaitlistEmail('');
    } catch (err) {
      console.error('Error adding to waitlist:', err);
      setWaitlistError('Failed to join waitlist. Please try again.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-[9999]" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200/50 max-w-2xl w-full p-4 md:p-8 relative z-[10000] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4 md:mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">
              {isMaxPlan ? "You're Already on the Highest Plan" : isUpgrade ? 'Upgrade Your Plan' : 'Start a New Cofounder Agreement'}
            </h2>
            {!isMaxPlan && (
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                {isUpgrade ? 'Get access to advanced features' : 'Choose your plan and get started'}
              </p>
            )}
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
          {!isUpgrade && (
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
          )}

          {/* Plan Selection */}
          <div className="mb-4 md:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Plan
            </label>
            <div className={`grid gap-3 md:gap-4 ${isUpgrade ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {Object.entries(PLANS).filter(([key]) => !isUpgrade || key === 'pro').map(([key, plan]) => {
                const isProPlan = key === 'pro';
                const isDisabled = isMaxPlan || key === currentPlan || isProPlan;
                return (
                <div key={key} className="relative">
                  {/* Coming Soon Badge for Pro */}
                  {isProPlan && (
                    <div className="absolute -top-2 -right-2 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                      Coming Soon
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => !isDisabled && setSelectedPlan(key)}
                    disabled={isDisabled}
                    className={`p-3 md:p-4 rounded-lg border-2 transition text-left w-full ${
                      isDisabled
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : selectedPlan === key
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                      </div>
                      {!isProPlan && (
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 ${
                          selectedPlan === key ? 'border-black' : 'border-gray-300'
                        }`}>
                          {selectedPlan === key && (
                            <div className="w-2 h-2 rounded-full bg-black"></div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
                      {isUpgrade && currentPlan === 'starter' && key === 'pro' ? (
                        <>
                          <span className="line-through text-gray-400 text-base md:text-lg mr-2">${plan.price}</span>
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

                  {/* Waitlist Form for Pro Plan */}
                  {isProPlan && (
                    <div className="p-3 pt-0 md:mt-4 md:p-4 md:bg-gray-50 md:rounded-lg md:border md:border-gray-200">
                      {waitlistSuccess ? (
                        <div className="text-center py-2 border-t md:border-0 border-gray-200 pt-3">
                          <p className="text-sm text-gray-900">✓ Thanks! We'll email you when Pro launches</p>
                        </div>
                      ) : (
                        <div className="border-t md:border-0 border-gray-200 pt-3 md:pt-0">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Join the waitlist
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={waitlistEmail}
                              onChange={(e) => setWaitlistEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-black focus:ring-0 bg-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleWaitlistSubmit(e);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleWaitlistSubmit}
                              disabled={waitlistLoading}
                              className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition disabled:opacity-50"
                            >
                              {waitlistLoading ? 'Joining...' : 'Join'}
                            </button>
                          </div>
                          {waitlistError && (
                            <p className="text-xs text-red-600 mt-2">{waitlistError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>

          {isMaxPlan ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-black text-white py-2.5 md:py-3 rounded text-sm md:text-base font-semibold hover:bg-gray-800 transition"
            >
              Got it
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="button-shimmer w-full bg-[#000000] text-white py-2.5 md:py-3 rounded text-sm md:text-base font-medium hover:bg-[#1a1a1a] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isUpgrade
                ? 'Upgrade'
                : 'Continue to Payment'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;
