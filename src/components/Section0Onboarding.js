import React, { useState, useEffect } from 'react';

function Section0Onboarding({ formData, handleChange, isReadOnly, showValidation }) {
  const [displayedText, setDisplayedText] = useState('');
  const fullQuote = '"Cofounders are to startups what location is to real estate."';

  useEffect(() => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= fullQuote.length) {
        setDisplayedText(fullQuote.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 38);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold text-black mb-6">Welcome to Cherrytree</h2>

      <p className="mb-4 leading-relaxed text-black">
        Starting a company is exciting… and messy. Different ideas about equity, responsibilities, and who's on first can quickly turn a great partnership into awkward tension. That's where this tool comes in.
      </p>
      <p className="mb-8 leading-relaxed text-black">
        Answer the survey questions honestly, collaborate in real time, and it'll generate a ready-to-use cofounder agreement tailored to your team. No legal jargon overload, no guessing who said what.
      </p>

      <div className="my-8 p-6 bg-gray-50 border-l-2 border-gray-800 rounded-r-lg">
        <p className="text-black italic text-lg leading-relaxed">
          {displayedText}
        </p>
        <p className="text-black mt-2 text-sm">
          — Paul Graham, founder of YC
        </p>
      </div>

      <hr className="my-12 border-gray-300 transition-opacity duration-700 animate-fade-in" style={{ animationDelay: '200ms' }} />

      <div className="space-y-12">
        {/* How Collaboration Works */}
        <div>
          <h3 className="text-xl font-bold text-black mb-4">How Collaboration Works</h3>
          <ul className="space-y-3 text-black leading-relaxed" style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
            <li>
              Click the <strong>Add Collaborators</strong> button in the top right corner to invite your cofounders. They must be collaborators to be included in the agreement.
            </li>
            <li>
              This is a collaborative project. Everyone can edit the survey and changes are saved automatically. At the end, you get a chance to review the full agreement so nothing mysterious went down while you weren't looking.
            </li>
            <li>
              You can fill out the survey asynchronously, but we highly recommend reviewing the final agreement together before signing.
            </li>
          </ul>
        </div>

        <hr className="my-12 border-gray-300 transition-opacity duration-700 animate-fade-in" style={{ animationDelay: '400ms' }} />

        {/* Tips */}
        <div>
          <h3 className="text-xl font-bold text-black mb-4">Tips</h3>
          <ul className="space-y-3 text-black leading-relaxed" style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
            <li>
              Use the survey as a conversation starter, not just a form. The act of answering differently is often more revealing than the answers themselves.
            </li>
            <li>
              Don't ignore the small stuff. How you handle these might not seem big but documenting it early saves major friction later.
            </li>
            <li>
              If you ever have questions or feedback, reach out to hello@cherrytree.app
            </li>
          </ul>
        </div>

        <hr className="my-12 border-gray-300 transition-opacity duration-700 animate-fade-in" style={{ animationDelay: '600ms' }} />

        {/* Ready */}
        <div className="pt-4">
          <h3 className="text-xl font-bold text-black">Ready?</h3>
        </div>
      </div>
    </div>
  );
}

export default Section0Onboarding;
