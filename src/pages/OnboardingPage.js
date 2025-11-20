import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Mark onboarding as complete
      if (currentUser) {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            hasCompletedOnboarding: true
          });
        } catch (error) {
          console.error('Error updating onboarding status:', error);
        }
      }
      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full">
          {currentStep === 1 && (
            <div className="text-center animate-fade-up">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Welcome to Cherrytree
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                We're excited to help you create your cofounder agreement. This document will help you and your cofounders align on important decisions before they become problems.
              </p>
              <p className="text-lg text-gray-600">
                In just a few minutes, you'll answer questions about equity, vesting, decision-making, and more. We'll turn your answers into a professional legal document.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center animate-fade-up">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                How it works
              </h1>
              <div className="text-left space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Answer questions</h3>
                    <p className="text-gray-600">Work through guided questions about your company, equity split, and operating rules.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Collaborate with cofounders</h3>
                    <p className="text-gray-600">Invite your cofounders to contribute their input and acknowledge key decisions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Get your agreement</h3>
                    <p className="text-gray-600">Preview and download your professionally formatted cofounder agreement.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-12">
        <div className="max-w-2xl mx-auto flex justify-between">
          {currentStep > 1 ? (
            <button
              onClick={handlePrevious}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2"
            >
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 8L2 8M2 8L8 2M2 8L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Previous
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={handleNext}
            className="next-button bg-black text-white px-7 py-2 rounded font-normal hover:bg-[#1a1a1a] transition flex items-center gap-2"
          >
            {currentStep === 2 ? 'Get Started' : 'Next'}
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[1, 2].map((step) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentStep === step ? 'bg-black' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default OnboardingPage;
