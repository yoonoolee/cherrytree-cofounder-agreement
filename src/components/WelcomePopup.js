import React, { useState } from 'react';

function WelcomePopup({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [wiggle, setWiggle] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    setWiggle(true);
    setTimeout(() => setWiggle(false), 500);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[9998] cursor-pointer"
        onClick={handleBackdropClick}
      />
      <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
        <div className={`bg-white rounded-lg shadow-xl max-w-lg w-full pt-4 md:pt-8 px-4 md:px-8 pb-2 md:pb-3 pointer-events-auto flex flex-col ${wiggle ? 'animate-wiggle' : ''}`} style={{ height: '85vh', maxHeight: '500px' }}>
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${step === s ? 'bg-black' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          {/* Step 1: Add Collaborators */}
          {step === 1 && (
            <div className="flex flex-col h-full">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                Welcome to Cherrytree
              </h2>
              <p className="text-sm text-gray-600 mb-3 md:mb-4">
                Add your cofounders as collaborators. They must be added to be included in the Agreement.
              </p>

              {/* Add Collaborators Animation */}
              <div className="relative bg-gray-50 rounded-lg p-2 md:p-5 mb-2 overflow-hidden" style={{ height: 'clamp(180px, 40vh, 240px)', minHeight: '180px', maxHeight: '240px', display: 'block' }}>
                {/* Cursor */}
                <div className="collaborator-cursor absolute w-4 h-4 z-30" style={{ pointerEvents: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="black" className="w-4 h-4">
                    <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.72a.5.5 0 0 0-.44.49Z"/>
                  </svg>
                </div>

                {/* Top bar with Add Collaborators button */}
                <div className="flex justify-end mb-4">
                  <button className="add-collab-btn text-xs px-3 py-1.5 rounded border border-gray-300 bg-white flex items-center gap-1.5 text-gray-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="font-medium">Add</span>
                  </button>
                </div>

                {/* Collaborator Form */}
                <div className="collab-form bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-3">Add your cofounders as collaborators</p>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        className="email-input w-full px-2 py-1.5 text-xs border border-gray-200 rounded"
                        readOnly
                      />
                      <span className="typed-email absolute left-2 top-1.5 text-xs text-gray-700"></span>
                      <span className="email-caret absolute left-2 top-1.5 w-px h-3.5 bg-black ml-0"></span>
                    </div>
                    <button className="invite-btn px-3 py-1.5 bg-black text-white text-xs rounded">
                      Invite
                    </button>
                  </div>

                  {/* Members List */}
                  <div className="members-list">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">Members</h4>
                    <div className="member-item bg-gray-50 rounded p-2">
                      <p className="text-xs font-medium text-gray-900">cofounder@example.com</p>
                      <p className="text-[10px] text-gray-500">
                        <span>Member</span>
                        <span className="mx-1">·</span>
                        <span className="text-black font-medium">Active</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <style>{`
                /* Initial states */
                .collab-form {
                  opacity: 0;
                  transform: scale(0.95);
                  animation: formAppear 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                }

                .members-list {
                  opacity: 0;
                  animation: membersAppear 6s steps(1) infinite;
                }

                .member-item {
                  opacity: 0;
                  transform: translateY(-4px);
                  animation: memberSlideIn 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                }

                /* Cursor animation */
                .collaborator-cursor {
                  animation: cursorMovement 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                }

                /* Button click effect */
                .add-collab-btn {
                  animation: buttonClick 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                }

                /* Email typing */
                .typed-email::after {
                  content: '';
                  animation: typeEmail 6s steps(1) infinite;
                }

                .email-caret {
                  animation: caretBlinkEmail 6s step-end infinite;
                }

                /* Invite button click */
                .invite-btn {
                  animation: inviteClick 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                }

                @keyframes cursorMovement {
                  0% { top: -20px; left: 50%; opacity: 0; }
                  5% { top: 20px; left: calc(100% - 45px); opacity: 1; }
                  10%, 15% { top: 20px; left: calc(100% - 45px); }
                  22% { top: 95px; left: 100px; }
                  25%, 70% { top: 95px; left: 100px; }
                  78% { top: 95px; left: calc(100% - 50px); }
                  82%, 100% { top: 95px; left: calc(100% - 50px); }
                }

                @keyframes buttonClick {
                  0%, 9% { transform: scale(1); background-color: white; }
                  10%, 12% { transform: scale(0.95); background-color: #f3f4f6; }
                  13%, 100% { transform: scale(1); background-color: white; }
                }

                @keyframes formAppear {
                  0%, 13% { opacity: 0; transform: scale(0.95); }
                  18%, 100% { opacity: 1; transform: scale(1); }
                }

                @keyframes typeEmail {
                  0%, 24% { content: ''; }
                  26% { content: 'c'; }
                  28% { content: 'co'; }
                  30% { content: 'cof'; }
                  32% { content: 'cofo'; }
                  34% { content: 'cofou'; }
                  36% { content: 'cofoun'; }
                  38% { content: 'cofounde'; }
                  40% { content: 'cofounder'; }
                  42% { content: 'cofounder@'; }
                  44% { content: 'cofounder@e'; }
                  46% { content: 'cofounder@ex'; }
                  48% { content: 'cofounder@exa'; }
                  50% { content: 'cofounder@exam'; }
                  52% { content: 'cofounder@examp'; }
                  54% { content: 'cofounder@exampl'; }
                  56% { content: 'cofounder@example'; }
                  58% { content: 'cofounder@example.'; }
                  60% { content: 'cofounder@example.c'; }
                  62% { content: 'cofounder@example.co'; }
                  64%, 100% { content: 'cofounder@example.com'; }
                }

                @keyframes caretBlinkEmail {
                  0%, 24% { opacity: 1; margin-left: 0; }
                  25%, 26% { opacity: 0; margin-left: 0; }
                  26% { opacity: 1; margin-left: 5px; }
                  28% { opacity: 1; margin-left: 11px; }
                  30% { opacity: 1; margin-left: 17px; }
                  32% { opacity: 1; margin-left: 23px; }
                  34% { opacity: 1; margin-left: 30px; }
                  36% { opacity: 1; margin-left: 37px; }
                  38% { opacity: 1; margin-left: 48px; }
                  40% { opacity: 1; margin-left: 58px; }
                  42% { opacity: 1; margin-left: 65px; }
                  44% { opacity: 1; margin-left: 70px; }
                  46% { opacity: 1; margin-left: 76px; }
                  48% { opacity: 1; margin-left: 83px; }
                  50% { opacity: 1; margin-left: 91px; }
                  52% { opacity: 1; margin-left: 99px; }
                  54% { opacity: 1; margin-left: 107px; }
                  56% { opacity: 1; margin-left: 117px; }
                  58% { opacity: 1; margin-left: 124px; }
                  60% { opacity: 1; margin-left: 129px; }
                  62%, 100% { opacity: 1; margin-left: 136px; }
                }

                @keyframes inviteClick {
                  0%, 81% { transform: scale(1); }
                  82%, 84% { transform: scale(0.95); }
                  85%, 100% { transform: scale(1); }
                }

                @keyframes membersAppear {
                  0%, 85% { opacity: 0; }
                  86%, 100% { opacity: 1; }
                }

                @keyframes memberSlideIn {
                  0%, 85% { opacity: 0; transform: translateY(-4px); }
                  89%, 100% { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-end items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="button-shimmer bg-[#000000] text-white px-4 md:px-6 py-2 rounded text-sm font-medium hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 flex-shrink-0"
                >
                  Continue
                  <svg width="16" height="14" viewBox="0 0 20 16" fill="none" className="flex-shrink-0">
                    <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Collab on the agreement */}
          {step === 2 && (
            <div className="flex flex-col h-full">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                Collab on the Agreement
              </h2>
              <p className="text-sm text-gray-600 mb-3 md:mb-4">
                You and your cofounders answer a set of guided questions together. Nobody has to play "project manager" or relay answers.
              </p>

              {/* Animation area */}
              <div className="relative bg-gray-50 rounded-lg p-2 md:p-5 mb-2 overflow-hidden" style={{ height: 'clamp(180px, 40vh, 240px)', minHeight: '180px', maxHeight: '240px', display: 'block' }}>
                {/* Black cursor */}
                <div className="cursor-black absolute w-4 h-4 z-20" style={{ pointerEvents: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="black" className="w-4 h-4">
                    <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.72a.5.5 0 0 0-.44.49Z"/>
                  </svg>
                </div>

                {/* White cursor */}
                <div className="cursor-white absolute w-4 h-4 z-20" style={{ pointerEvents: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1" className="w-4 h-4">
                    <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.72a.5.5 0 0 0-.44.49Z"/>
                  </svg>
                </div>

                {/* Question 1: Company Name */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Company Name</p>
                  <div className="relative bg-white border border-gray-200 rounded px-3 py-2 text-sm h-9">
                    <span className="typing-text text-gray-700"></span>
                    <span className="text-caret"></span>
                  </div>
                </div>

                {/* Question 2: Industry dropdown */}
                <div className="relative">
                  <p className="text-xs text-gray-500 mb-1">Industry</p>
                  <div className="relative bg-white border border-gray-200 rounded px-3 py-2 text-sm h-9 flex items-center justify-between">
                    <span className="selected-industry"></span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {/* Dropdown menu */}
                  <div className="dropdown-menu absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
                    <div className="dropdown-option-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Artificial Intelligence</div>
                    <div className="dropdown-option-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Food and Beverage</div>
                    <div className="dropdown-option-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Healthtech</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs md:text-sm text-gray-500 hover:text-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="button-shimmer bg-[#000000] text-white px-4 md:px-6 py-2 rounded text-sm font-medium hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 flex-shrink-0"
                >
                  Continue
                  <svg width="16" height="14" viewBox="0 0 20 16" fill="none" className="flex-shrink-0">
                    <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                </div>
              </div>

              <style>{`
                /* Black cursor - clicks and types in company name */
                .cursor-black {
                  top: 20px;
                  left: 20px;
                  animation: blackCursorMove 6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
                }

                /* White cursor - selects from dropdown */
                .cursor-white {
                  top: 140px;
                  left: 320px;
                  animation: whiteCursorMove 6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
                }

                /* Typing text animation */
                .typing-text::after {
                  content: '';
                  animation: typeText 6s steps(1) infinite;
                }

                /* Text caret blink */
                .text-caret {
                  display: inline-block;
                  width: 1px;
                  height: 14px;
                  background: black;
                  margin-left: 1px;
                  animation: caretBlink 6s step-end infinite;
                }

                /* Dropdown visibility */
                .dropdown-menu {
                  opacity: 0;
                  transform: scaleY(0);
                  transform-origin: top;
                  animation: dropdownShow 6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
                }

                /* Selected industry text */
                .selected-industry::after {
                  content: 'Select industry';
                  color: #9CA3AF;
                  animation: industrySelect 6s steps(1) infinite;
                }

                /* Highlight selected option */
                .dropdown-option-1 {
                  animation: optionHighlight 6s steps(1) infinite;
                }

                @keyframes blackCursorMove {
                  0% { top: 20px; left: 20px; }
                  8% { top: 52px; left: 120px; }
                  12%, 45% { top: 52px; left: 120px; }
                  55%, 100% { top: 52px; left: 120px; }
                }

                @keyframes whiteCursorMove {
                  0%, 15% { top: 140px; left: 320px; }
                  25% { top: 132px; left: 350px; }
                  30%, 34% { top: 132px; left: 350px; }
                  40%, 59% { top: 158px; left: 120px; }
                  65%, 100% { top: 158px; left: 120px; }
                }

                @keyframes typeText {
                  0%, 12% { content: ''; }
                  14% { content: 'C'; }
                  16% { content: 'Ch'; }
                  18% { content: 'Che'; }
                  20% { content: 'Cher'; }
                  22% { content: 'Cherr'; }
                  24% { content: 'Cherry'; }
                  26% { content: 'Cherryt'; }
                  28% { content: 'Cherrytr'; }
                  30% { content: 'Cherrytree'; }
                  32%, 100% { content: 'Cherrytree'; }
                }

                @keyframes caretBlink {
                  0%, 12% { opacity: 1; }
                  13%, 14% { opacity: 0; }
                  15%, 100% { opacity: 1; }
                }

                @keyframes dropdownShow {
                  0%, 29% { opacity: 0; transform: scaleY(0); }
                  30%, 52% { opacity: 1; transform: scaleY(1); }
                  53%, 100% { opacity: 0; transform: scaleY(0); }
                }

                @keyframes industrySelect {
                  0%, 49% { content: 'Select industry'; color: #9CA3AF; }
                  50%, 100% { content: 'Artificial Intelligence'; color: #374151; }
                }

                @keyframes optionHighlight {
                  0%, 39% { background: white; }
                  40%, 49% { background: #F3F4F6; }
                  50%, 52% { background: #E5E7EB; }
                  53%, 100% { background: white; }
                }
              `}</style>
            </div>
          )}

          {/* Step 3: Final Review */}
          {step === 3 && (
            <div className="flex flex-col h-full">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                Do a Final Review
              </h2>
              <p className="text-sm text-gray-600 mb-3 md:mb-4">
                Once everyone has answered all the questions, review the generated agreement together and approve it.
              </p>

              {/* Document preview */}
              <div className="relative bg-gray-50 rounded-lg p-2 md:p-5 mb-2 overflow-hidden flex justify-center items-center" style={{ height: 'clamp(180px, 40vh, 240px)', minHeight: '180px', maxHeight: '240px' }}>
                <div className="bg-white rounded border border-gray-200 p-4 h-full relative" style={{ width: '85%' }}>
                  <h3 className="text-xs text-gray-500 mb-3">Cofounder Agreement</h3>
                  <div className="space-y-2">
                    <div className="h-1 bg-gray-200 rounded w-full"></div>
                    <div className="h-1 bg-gray-200 rounded w-11/12"></div>
                    <div className="h-1 bg-gray-200 rounded w-full"></div>
                    <div className="h-1 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-1 bg-gray-200 rounded w-full"></div>
                    <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-1 bg-gray-200 rounded w-full"></div>
                    <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
                {/* Scanner line */}
                <div className="scanner-line absolute h-0.5 bg-gray-300" style={{ left: '5%', right: '5%', boxShadow: '0 0 6px 1px rgba(209, 213, 219, 0.5)' }}></div>
              </div>

              <style>{`
                .scanner-line {
                  top: 20px;
                  animation: scanDocument 4s ease-in-out infinite;
                }
                @keyframes scanDocument {
                  0% { top: 20px; opacity: 1; }
                  25% { top: calc(100% - 24px); opacity: 1; }
                  50% { top: 20px; opacity: 1; }
                  51% { top: 20px; opacity: 0; }
                  60% { top: 20px; opacity: 0; }
                  61% { top: 20px; opacity: 1; }
                  85% { top: calc(100% - 24px); opacity: 1; }
                  100% { top: 20px; opacity: 1; }
                }
              `}</style>

              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="text-xs md:text-sm text-gray-500 hover:text-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  className="button-shimmer bg-[#000000] text-white px-4 md:px-6 py-2 rounded text-sm font-medium hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 flex-shrink-0"
                >
                  Get Started
                  <svg width="16" height="14" viewBox="0 0 20 16" fill="none" className="flex-shrink-0">
                    <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default WelcomePopup;
