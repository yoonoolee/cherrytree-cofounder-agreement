import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function ProWaitlistForm({ source = 'unknown' }) {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (waitlistLoading) return;

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
        source
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

  if (waitlistSuccess) {
    return (
      <div className="text-center py-3">
        <p className="text-sm text-gray-900">✓ Thanks! We'll email you when Pro is available</p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Join the waitlist
      </label>
      <div className="flex gap-2">
        <input
          type="email"
          value={waitlistEmail}
          onChange={(e) => setWaitlistEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black bg-white"
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
          className="px-4 py-2 bg-[#06271D] text-white text-sm font-medium rounded hover:bg-[#0a3d2e] transition disabled:opacity-50"
        >
          {waitlistLoading ? 'Joining...' : 'Join'}
        </button>
      </div>
      {waitlistError && (
        <p className="text-xs text-red-600 mt-2">{waitlistError}</p>
      )}
    </div>
  );
}

export default ProWaitlistForm;
