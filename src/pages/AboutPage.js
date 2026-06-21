import React, { useState, useEffect } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';
import MarketingGrain from '../components/MarketingGrain';

function AboutPage() {
  usePageMeta({
    title: 'About Cherrytree — Fair Cofounder Agreements for Startups',
    description: 'Learn how Cherrytree helps early-stage cofounders create fair agreements that protect both equity stakes and relationships. Built by founders, for founders.',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'About' }],
  });

  const [typedCompany, setTypedCompany] = useState('');
  const companyText = 'with the right company';

  // Typing animation for "with the right company", loops like the hero typewriter
  useEffect(() => {
    let cancelled = false;
    const timeouts = [];
    const schedule = (fn, ms) => { const t = setTimeout(fn, ms); timeouts.push(t); return t; };

    const typeLoop = () => {
      let index = 0;
      setTypedCompany('');
      const type = () => {
        if (cancelled) return;
        if (index < companyText.length) {
          index++;
          setTypedCompany(companyText.slice(0, index));
          schedule(type, 60);
        } else {
          schedule(() => {
            setTypedCompany('');
            schedule(typeLoop, 400);
          }, 1400);
        }
      };
      type();
    };

    schedule(typeLoop, 600);
    return () => { cancelled = true; timeouts.forEach(clearTimeout); };
  }, []);

  return (
    <div className="lp" style={{ minHeight: '100vh' }}>
      <MarketingGrain />
      <MarketingNav />

      {/* Hero */}
      <section className="lp-page-hero">
        <div className="lp-overline">About</div>
        <h1 className="lp-hero-headline" style={{ fontSize: 'clamp(36px,6vw,68px)', margin: '0 auto 28px', textAlign: 'center' }}>
          <span className="lp-hl-line"><span className="lp-hl-inner">Big ideas grow</span></span>
          <span className="lp-hl-line"><span className="lp-hl-inner"><em>{typedCompany}<span className="lp-cursor"/></em></span></span>
        </h1>
      </section>

      {/* Backstory */}
      <section className="lp-page-section">
        <div className="lp-about-row">
          <div className="lp-about-row-label">
            <div className="lp-overline">Note from our CEO</div>
            <h2 className="lp-about-row-title">The Backstory</h2>
          </div>
          <div className="lp-about-row-body">
            <p>
              Hey, I'm Tim. I started Cherrytree after learning firsthand how challenging yet rewarding it is to build something with cofounders. Since then, I've taught over a thousand entrepreneurship students, written a book on cofounder dynamics, and teamed up with seasoned coaches, attorneys, and AI experts. We've now worked with hundreds of teams just like yours across a dozen industries.
            </p>
            <p>Our mission is simple: <em>to create cofounder magic.</em></p>
          </div>
        </div>
      </section>

      {/* Work with us */}
      <section className="lp-page-section" style={{ paddingTop: 0 }}>
        <div className="lp-about-row">
          <div className="lp-about-row-label">
            <div className="lp-overline">We're hiring</div>
            <h2 className="lp-about-row-title">Work With Us</h2>
          </div>
          <div className="lp-about-row-body">
            <h3 className="lp-about-role">Student Internship (part-time)</h3>
            <p>
              We're looking for an intern who's genuinely excited about startups and building things from the ground up. You'll work closely with our CEO &amp; Founder, getting hands-on experience across the business from research and growth strategies to operations, project coordination, and fundraising. This is a remote role, but bonus points if you're in SF or Berkeley.
            </p>
            <p><em>Apply here.</em></p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

export default AboutPage;
