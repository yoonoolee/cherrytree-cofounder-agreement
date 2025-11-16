import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Header from '../components/Header';
import Footer from '../components/Footer';

function AboutPage() {
  const navigate = useNavigate();
  const [typedCompany, setTypedCompany] = useState('');
  const [showPeriod, setShowPeriod] = useState(false);
  const companyText = 'with the right company';

  // Scroll-triggered section animations
  useScrollAnimation();

  // Trigger hero content fade-in on mount
  useEffect(() => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      setTimeout(() => {
        heroContent.classList.add('section-visible');
      }, 100);
    }
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
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="hero-content">
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
        </div>
      </section>

      {/* The Backstory Section */}
      <section className="scroll-section py-24 px-6">
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
      <section className="scroll-section pt-24 pb-40 px-6">
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
      <Footer />

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
