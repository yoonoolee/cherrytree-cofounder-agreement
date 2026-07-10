import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { UserButton, useClerk } from '@clerk/clerk-react';
import PaymentModal from '../components/PaymentModal';
import { useProjects } from '../hooks/useProjects';
import { calculateProjectProgress, countCompletedSections } from '../utils/progressCalculation';
import { FIELDS } from '../config/surveySchema';

function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, userMemberships, orgsLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReferPopup, setShowReferPopup] = useState(false);
  const [referLinkCopied, setReferLinkCopied] = useState(false);

  const { projects, loading } = useProjects(currentUser, userMemberships, orgsLoaded, authLoading);

  const welcomeRef = useRef(null);
  const subtitleRef = useRef(null);

  useEffect(() => {
    if (authLoading || loading) return;

    const welcome = welcomeRef.current;
    const sub = subtitleRef.current;

    if (welcome) {
      welcome.style.opacity = '0';
      welcome.style.transform = 'translateY(12px)';
      welcome.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    }
    if (sub) {
      sub.style.opacity = '0';
      sub.style.transform = 'translateY(10px)';
      sub.style.transition = 'opacity 0.5s ease 0.12s, transform 0.5s ease 0.12s';
    }

    const cards = document.querySelectorAll('[data-animate-card]');
    cards.forEach((card) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
    });

    const timer = setTimeout(() => {
      if (welcome) { welcome.style.opacity = '1'; welcome.style.transform = 'translateY(0)'; }
      if (sub) { sub.style.opacity = '1'; sub.style.transform = 'translateY(0)'; }
    }, 60);

    const cardArray = Array.from(cards);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = cardArray.indexOf(entry.target) * 0.05;
          entry.target.style.transition = `opacity 0.45s ease ${delay}s, transform 0.45s ease ${delay}s, background 0.2s`;
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    cards.forEach(card => observer.observe(card));

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [authLoading, loading]);

  const handlePaymentSuccess = () => setShowPaymentModal(false);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F3EE' }}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F6F3EE', fontFamily: "'Outfit', sans-serif", color: '#1a1a1a' }}>

      {/* Sidebar */}
      <aside style={{ width: '210px', minWidth: '210px', background: '#F1EEE9', display: 'flex', flexDirection: 'column', padding: '28px 0 24px', overflowY: 'auto', position: 'fixed', height: '100vh', top: 0, left: 0, zIndex: 10 }}>
        {/* Logo */}
        <div style={{ padding: '20px 30px 40px' }}>
          <svg width="52" height="52" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
            <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="#1a1a1a" shapeRendering="geometricPrecision"/>
          </svg>
        </div>

        {/* Platform nav */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 200, color: '#aaa', padding: '0 20px 10px', letterSpacing: '0.01em' }}>Platform</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              { label: 'Dashboard', action: () => navigate('/dashboard'), active: true },
              { label: 'Recent Documents', action: null },
              { label: 'Chat with AI', action: null },
              { label: 'Billing', action: () => openUserProfile() },
            ].map(({ label, action, active }) => (
              <li key={label}>
                <button
                  onClick={action || undefined}
                  disabled={!action}
                  style={{ display: 'block', width: active ? 'calc(100% - 20px)' : '100%', textAlign: 'left', padding: '10px 20px', fontSize: '13.5px', fontWeight: active ? 500 : 100, color: active ? '#1a1a1a' : !action ? '#ccc' : '#666', background: active ? '#e3dfd8' : 'none', border: 'none', cursor: action ? 'pointer' : 'default', borderRadius: active ? '5px' : 0, margin: active ? '0 10px' : 0, transition: 'color 0.15s' }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources nav */}
        <div style={{ marginTop: '40px' }}>
          <div style={{ fontSize: '11px', fontWeight: 200, color: '#aaa', padding: '0 20px 10px', letterSpacing: '0.01em' }}>Resources</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              { label: 'Newsletter', action: () => window.open('https://cherrytree.beehiiv.com/', '_blank') },
              { label: 'Contact', action: () => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 }) },
            ].map(({ label, action }) => (
              <li key={label}>
                <button onClick={action} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 20px', fontSize: '13.5px', fontWeight: 100, color: '#666', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '210px', flex: 1, overflowY: 'auto', padding: '32px 52px 60px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
          <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
        </div>

        {/* Welcome */}
        <h1 ref={welcomeRef} style={{ fontFamily: 'Instrument Serif, serif', fontSize: '44px', fontWeight: 200, letterSpacing: '-0.5px', marginBottom: '12px', lineHeight: 1.1 }}>
          Welcome back, <em>{currentUser?.firstName || 'there'}</em>.
        </h1>
        <p ref={subtitleRef} style={{ fontSize: '14px', fontWeight: 300, color: '#555', lineHeight: 1.55, maxWidth: '440px', marginBottom: '40px' }}>
          {projects.length > 0
            ? "Let's jump back into your open agreements."
            : "Create your first cofounder agreement to get started."}
        </p>

        {/* Agreement cards */}
        {projects.map((project) => {
          const progress = calculateProjectProgress(project);
          const sectionsCompleted = countCompletedSections(project);

          const lastEditTime = project.lastUpdated || project.updatedAt || project.createdAt;
          let timeAgo = '';
          if (lastEditTime) {
            const now = new Date();
            const lastEdit = lastEditTime.toDate ? lastEditTime.toDate() : new Date(lastEditTime);
            const hoursAgo = Math.floor((now - lastEdit) / (1000 * 60 * 60));
            if (hoursAgo < 1) {
              const minutesAgo = Math.floor((now - lastEdit) / (1000 * 60));
              timeAgo = minutesAgo < 1 ? 'just now' : `${minutesAgo}m ago`;
            } else if (hoursAgo < 24) {
              timeAgo = `${hoursAgo}h ago`;
            } else {
              timeAgo = `${Math.floor(hoursAgo / 24)}d ago`;
            }
          }

          const cofounders = project.surveyData?.cofounders || [];
          const cofounderNames = cofounders.map(cf => cf[FIELDS.COFOUNDER_FULL_NAME]).filter(Boolean);

          const deadline = project.editDeadline
            ? (project.editDeadline.toDate ? project.editDeadline.toDate() : new Date(project.editDeadline))
            : null;
          const deadlineStr = deadline
            ? deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : null;

          return (
            <div key={project.id} data-card data-animate-card style={{ background: '#e3dfd8', borderRadius: '5px', padding: '22px 24px 0', marginBottom: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: '16px' }}>
                {/* Left */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 200, color: '#888', marginBottom: '10px', letterSpacing: '0.01em' }}>
                    Cofounder Agreement
                  </div>
                  <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: '32px', fontWeight: 400, letterSpacing: '-0.3px', marginBottom: '12px', lineHeight: 1.1 }}>
                    {project.name || 'Untitled Project'}
                  </div>
                  {cofounderNames.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '32px' }}>
                      {cofounderNames.map((name, i) => (
                        <span key={i} style={{ fontSize: '11.5px', fontWeight: 200, color: '#4e7068', background: '#C7CECB', borderRadius: '4px', padding: '3px 10px' }}>
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  {cofounderNames.length === 0 && <div style={{ marginBottom: '32px' }} />}

                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '18px', flexWrap: 'wrap' }}>
                    {timeAgo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 300, color: '#666' }}>
                        <svg style={{ width: '13px', height: '13px', opacity: 0.6, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round"/>
                        </svg>
                        Edited {timeAgo}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 300, color: '#666' }}>
                      <svg style={{ width: '13px', height: '13px', opacity: 0.6, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round"/>
                      </svg>
                      {sectionsCompleted} out of 10 sections
                    </div>
                    {deadlineStr && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 300, color: '#666' }}>
                        <svg style={{ width: '13px', height: '13px', opacity: 0.6, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M3 17l5-5 4 4 9-9" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit by {deadlineStr}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '2px', paddingBottom: '18px', flexShrink: 0 }}>
                  <div style={{ background: '#C7CECB', borderRadius: '4px', padding: '14px 20px 10px', textAlign: 'center', minWidth: '100px' }}>
                    <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: '40px', fontWeight: 400, color: '#4B7263', lineHeight: 1, letterSpacing: '2px' }}>
                      {progress}%
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 300, color: '#4B7263', marginTop: '2px' }}>Completed</div>
                  </div>
                  <button
                    onClick={(e) => {
                      const card = e.currentTarget.closest('[data-card]');
                      const rect = card.getBoundingClientRect();

                      const overlay = document.createElement('div');
                      overlay.style.cssText = `
                        position: fixed;
                        top: ${rect.top}px;
                        left: ${rect.left}px;
                        width: ${rect.width}px;
                        height: ${rect.height}px;
                        background: #e3dfd8;
                        border-radius: 5px;
                        z-index: 9999;
                        pointer-events: none;
                        transition: top 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                                    left 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                                    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                                    height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                                    border-radius 0.4s ease,
                                    background 0.12s ease 0.05s;
                      `;
                      document.body.appendChild(overlay);

                      // Force reflow then expand to fullscreen + shift to survey bg colour
                      overlay.getBoundingClientRect();
                      requestAnimationFrame(() => {
                        overlay.style.top = '0';
                        overlay.style.left = '0';
                        overlay.style.width = '100vw';
                        overlay.style.height = '100vh';
                        overlay.style.borderRadius = '0';
                        overlay.style.background = '#F6F3EE';
                      });

                      setTimeout(() => {
                        navigate(`/survey/${project.id}`);
                        // Give React a couple frames to render the survey, then fade the overlay out
                        setTimeout(() => {
                          overlay.style.transition = 'opacity 0.35s ease';
                          overlay.style.opacity = '0';
                          setTimeout(() => overlay.remove(), 380);
                        }, 80);
                      }, 560);
                    }}
                    style={{ background: '#4e7068', color: '#fff', border: 'none', borderRadius: '3px', padding: '9px 24px', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 200, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#3d5a54'}
                    onMouseLeave={e => e.currentTarget.style.background = '#4e7068'}
                  >
                    Continue
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: '4px', background: '#c4c0b7', margin: '0 -24px', position: 'relative' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#4B7263', transition: 'width 0.8s ease' }} />
              </div>
            </div>
          );
        })}

        {/* Create new card */}
        <button
          data-animate-card
          onClick={() => setShowPaymentModal(true)}
          style={{ width: '100%', background: '#b6c8c0', borderRadius: '5px', padding: '26px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', cursor: 'pointer', marginBottom: '12px', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#A8BCB3'}
          onMouseLeave={e => e.currentTarget.style.background = '#b6c8c0'}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: '26px', fontWeight: 200, color: '#1a1a1a', letterSpacing: '-0.2px', marginBottom: '4px' }}>
              Create a new agreement
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 200, color: '#3a3a3a' }}>One document per company.</div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dedad2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#333', flexShrink: 0, transition: 'background 0.2s' }}>
            +
          </div>
        </button>

      </main>

      {/* Refer a Friend popup */}
      {showReferPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => { setShowReferPopup(false); setReferLinkCopied(false); }}>
          <div className="bg-white rounded-lg shadow-xl p-10 max-w-lg w-full mx-4 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowReferPopup(false); setReferLinkCopied(false); }} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Refer a Friend</h3>
            <p className="text-sm text-gray-500 mb-6">Share Cherrytree with a friend. When they sign up, you both get a reward.</p>
            <div className="flex gap-2">
              <input type="text" readOnly value={`${window.location.origin}?ref=${currentUser?.id || ''}`} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600" />
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?ref=${currentUser?.id || ''}`); setReferLinkCopied(true); }}
                className="py-2 bg-[#06271D] text-white text-sm rounded-lg hover:bg-[#0a3d2b] transition w-20 text-center flex-shrink-0"
              >
                {referLinkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} onSuccess={handlePaymentSuccess} />
      )}
    </div>
  );
}

export default DashboardPage;
