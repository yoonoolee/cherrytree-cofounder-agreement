import React, { useState, useEffect } from 'react';

function Section0Onboarding({ formData, handleChange, isReadOnly, showValidation, onGetStarted }) {
  const [displayedTagline, setDisplayedTagline] = useState('');
  const fullTagline = 'Great companies start with great company.';

  useEffect(() => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= fullTagline.length) {
        setDisplayedTagline(fullTagline.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 38);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="-mx-20 px-8">
      <div className="flex gap-20">
        {/* Left Column - Intro */}
        <div className="flex-1 flex flex-col">
        <h2 className="text-3xl font-medium text-black mb-2">Welcome to Cherrytree</h2>
        <p className="text-lg mb-6" style={{ color: '#6B7280' }}>{displayedTagline}</p>

        <div className="mt-auto">
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 leading-relaxed font-light" style={{ color: '#6B7280' }}>
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span>Align on equity, roles, and responsibilities.</span>
          </div>
          <div className="flex items-start gap-3 leading-relaxed font-light" style={{ color: '#6B7280' }}>
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Prevent awkward tension before it starts.</span>
          </div>
          <div className="flex items-start gap-3 leading-relaxed font-light" style={{ color: '#6B7280' }}>
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Generate a ready-to-use cofounder agreement.</span>
          </div>
          <div className="flex items-start gap-3 leading-relaxed font-light" style={{ color: '#6B7280' }}>
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No legal jargon, no guesswork.</span>
          </div>
        </div>

        <button
          onClick={onGetStarted}
          className="button-shimmer w-full bg-black text-white px-7 py-3 rounded font-normal hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2"
        >
          Get Started
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        </div>
        </div>

      {/* Right Column - How It Works */}
      <div className="flex-1 space-y-6">
        <div className="flex gap-4">
          <span className="font-bold flex-shrink-0" style={{ color: '#6B7280' }}>1</span>
          <div>
            <h3 className="font-bold mb-2" style={{ color: '#6B7280' }}>Invite your cofounders</h3>
            <p className="leading-relaxed font-light" style={{ color: '#6B7280' }}>
              Click the <strong>Add Collaborators</strong> button to invite your cofounders. They must be collaborators to be included in the agreement.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="font-bold flex-shrink-0" style={{ color: '#6B7280' }}>2</span>
          <div>
            <h3 className="font-bold mb-2" style={{ color: '#6B7280' }}>This is a collaborative project</h3>
            <p className="leading-relaxed font-light" style={{ color: '#6B7280' }}>
              Everyone can edit the survey and changes are auto-saved. Review the agreement before submitting so there are no surprises.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="font-bold flex-shrink-0" style={{ color: '#6B7280' }}>3</span>
          <div>
            <h3 className="font-bold mb-2" style={{ color: '#6B7280' }}>You can fill out the survey asynchronously</h3>
            <p className="leading-relaxed font-light" style={{ color: '#6B7280' }}>
              But we highly recommend reviewing the final agreement together before signing.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Section0Onboarding;
