import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [videoOpacity, setVideoOpacity] = useState(0);

  const handleGetStarted = async () => {
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
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between">
        <img src="/images/cherrytree-logo.png" alt="Cherrytree" className="h-8" />
        <button
          onClick={() => signOut(auth).then(() => navigate('/'))}
          className="text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Sign out
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-start justify-center px-6 pt-24">
        <div className="max-w-3xl w-full">
          <div className="text-left animate-fade-up">
            <h1 className="text-4xl font-medium text-gray-900 mb-6">
              Welcome to Cherrytree!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              You and your cofounders will answer a series of guided questions. Once you're done, we'll turn your responses into a fully complete, ready-to-use Cofounder Agreement.
            </p>
            <div className="w-full bg-white rounded-lg overflow-hidden border border-gray-200 shadow-lg" style={{ aspectRatio: '1100/595' }}>
              <video
                autoPlay
                muted
                playsInline
                ref={(video) => {
                  if (video) video.playbackRate = 1.2;
                }}
                onTimeUpdate={(e) => {
                  const video = e.target;
                  const duration = video.duration;
                  const currentTime = video.currentTime;
                  const fadeInTime = 0.3;
                  const fadeOutTime = 0.8;

                  if (currentTime < fadeInTime) {
                    const progress = currentTime / fadeInTime;
                    setVideoOpacity(progress * progress);
                  } else if (currentTime > duration - fadeOutTime) {
                    const progress = (duration - currentTime) / fadeOutTime;
                    setVideoOpacity(progress * progress);
                  } else {
                    setVideoOpacity(1);
                  }
                }}
                onLoadedData={() => setVideoOpacity(0)}
                onEnded={(e) => {
                  const video = e.target;
                  setTimeout(() => {
                    video.currentTime = 0;
                    video.play();
                  }, 1000);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  opacity: videoOpacity,
                  transition: 'opacity 0.15s ease-out'
                }}
              >
                <source src="/images/Cherrytree - Cofounder Agreements for Early-Stage Teams 11-21-2025 20-27-31.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation button */}
      <div className="px-6 pb-12">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={handleGetStarted}
            className="next-button bg-black text-white px-7 py-2 rounded font-normal hover:bg-[#1a1a1a] transition flex items-center gap-2"
          >
            Let's Begin
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 8L18 8M18 8L12 2M18 8L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
