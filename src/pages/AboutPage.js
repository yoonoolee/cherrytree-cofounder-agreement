import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

function AboutPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [typedCompany, setTypedCompany] = useState('');
  const [showPeriod, setShowPeriod] = useState(false);
  const companyText = 'with the right company';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Typing animation for "with the right company"
  useEffect(() => {
    const typeLoop = () => {
      let index = 0;
      setShowPeriod(false);
      const type = () => {
        if (index < companyText.length) {
          index++;
          setTypedCompany(companyText.slice(0, index));
          setTimeout(type, 100);
        } else {
          setShowPeriod(true);
          setTimeout(() => {
            setTypedCompany('');
            setShowPeriod(false);
            setTimeout(typeLoop, 200);
          }, 1000);
        }
      };
      type();
    };

    const initialTimeout = setTimeout(typeLoop, 50);
    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/images/cherrytree-logo.png"
                alt="Cherrytree"
                style={{ height: '32px', width: 'auto' }}
              />
            </div>

            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2 text-sm">
              <button onClick={() => navigate('/equity-calculator')} className="text-[#808080] hover:text-black transition">Equity Calculator</button>
              <a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-[#808080] hover:text-black transition">Newsletter</a>
              <button onClick={() => navigate('/pricing')} className="text-[#808080] hover:text-black transition">Pricing</button>
              <button onClick={() => navigate('/about')} className="text-black transition">About</button>
            </nav>

            <div className="hidden md:flex items-center gap-4 text-sm">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-[#808080] hover:text-black transition"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#808080] hover:text-black transition"
                >
                  Login
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="button-shimmer bg-[#000000] text-white px-5 py-1.5 rounded-md hover:bg-[#1a1a1a] transition"
              >
                Create agreement
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="headline-container-about">
          <h1 className="typing-title-about font-heading">
            <span className="first-line-about">Big ideas grow</span>
            <span className="second-line-about">
              <span className="typing-container-about">
                <em className="typing-company">{typedCompany || '\u00A0'}</em>
              </span>
              <span className="typing-period">{showPeriod ? '.' : '\u00A0'}</span>
            </span>
          </h1>
        </div>
      </section>

      {/* The Backstory Section */}
      <section className="py-24 px-6">
        <div className="flex justify-center">
          <div className="flex gap-24 items-start" style={{ maxWidth: '1200px' }}>
            <div className="flex-shrink-0" style={{ minWidth: '280px' }}>
              <p className="text-sm tracking-wider" style={{ color: '#999999', fontFamily: 'Inter, sans-serif', margin: '0 0 16px 0', padding: 0 }}>
                NOTE FROM OUR CEO
              </p>
              <h2 className="font-heading text-[46px] font-normal leading-tight" style={{ margin: 0, padding: 0 }}>
                The Backstory
              </h2>
            </div>
            <div className="flex-1 max-w-[620px]">
              <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                Hey, I'm Tim. I started Cherrytree after learning firsthand how challenging yet rewarding it is to build something with cofounders. Since then, I've taught over a thousand entrepreneurship students, written a book on cofounder dynamics, and teamed up with seasoned coaches, attorneys, and AI experts. We've now worked with hundreds of teams just like yours across a dozen industries.
              </p>
              <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                Our mission is simple: <em>to create cofounder magic.</em>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Work With Us Section */}
      <section className="py-24 px-6">
        <div className="flex justify-center">
          <div className="flex gap-24 items-start" style={{ maxWidth: '1200px' }}>
            <div className="flex-shrink-0" style={{ minWidth: '280px' }}>
              <p className="text-sm tracking-wider" style={{ color: '#999999', fontFamily: 'Inter, sans-serif', margin: '0 0 16px 0', padding: 0 }}>
                WE'RE HIRING
              </p>
              <h2 className="font-heading text-[46px] font-normal leading-tight" style={{ margin: 0, padding: 0 }}>
                Work With Us
              </h2>
            </div>
            <div className="flex-1 max-w-[620px]">
              <h3 className="text-[15px] tracking-wide mb-4" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                STUDENT INTERNSHIP (part-time)
              </h3>
              <p className="text-[16px] leading-relaxed mb-6" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                We're looking for an intern who's genuinely excited about startups and building things from the ground up. You'll work closely with our CEO & Founder, getting hands-on experience across the business from research and growth strategies to operations, project coordination, and fundraising. This is a remote role, but bonus points if you're in SF or Berkeley.
              </p>
              <p className="text-[16px] leading-relaxed" style={{ color: '#716B6B', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                <em>Apply here.</em>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black text-white pt-24 pb-20 px-6">
        {/* Rounded top border */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-white rounded-b-[48px]"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            {/* Left side - Logo and copyright */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg width="32" height="32" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                  <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="white"/>
                </svg>
                <span className="text-white text-xl font-semibold">Cherrytree</span>
              </div>
              <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Cherrytree</p>
            </div>

            {/* Right side - Three columns */}
            <div className="grid grid-cols-3 gap-12 ml-auto">
              <div>
                <h4 className="text-white text-sm mb-4">Product</h4>
                <ul className="space-y-4 text-sm">
                  <li><button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition">Contract Creator</button></li>
                  <li><button onClick={() => navigate('/equity-calculator')} className="text-gray-400 hover:text-white transition">Equity Calculator</button></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Compatibility Quiz</a></li>
                  <li><button onClick={() => navigate('/pricing')} className="text-gray-400 hover:text-white transition">Pricing</button></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white text-sm mb-4">Resources</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Newsletter</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Coaching</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Attorney</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white text-sm mb-4">Company</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Terms</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .headline-container-about {
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0;
        }

        .typing-title-about {
          font-size: 3.5rem;
          font-weight: 400;
          line-height: 1.25;
          margin: 0;
          width: fit-content;
          padding-bottom: 0.05em;
          text-align: center;
        }

        .first-line-about, .second-line-about {
          display: block;
          white-space: nowrap;
          text-align: center;
          margin: 0;
          overflow: visible;
        }

        .second-line-about {
          margin-top: -0.1em;
        }

        .typing-container-about {
          display: inline-block;
          width: auto;
          vertical-align: baseline;
          min-width: 0;
        }

        .typing-company {
          display: inline-block;
          font-style: italic;
          font-family: inherit;
          font-weight: inherit;
          visibility: visible;
        }

        .typing-period {
          display: inline-block;
          font-style: inherit;
          font-weight: inherit;
        }
      `}</style>
    </div>
  );
}

export default AboutPage;
