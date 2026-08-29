import React, { useEffect, useRef } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';
import MarketingGrain from '../components/MarketingGrain';

const SECTIONS = [
  {
    overline: 'Note from our CEO',
    title: 'The Backstory',
    body: (
      <>
        <p>
          Hey, I'm Tim. I started Cherrytree after learning firsthand how challenging yet rewarding it is to build something with cofounders. Since then, I've taught over a thousand entrepreneurship students, written a book on cofounder dynamics, and teamed up with seasoned coaches, attorneys, and AI experts. We've now worked with hundreds of teams just like yours across a dozen industries.
        </p>
        <p>Our mission is simple: <em>to create cofounder magic.</em></p>
      </>
    ),
  },
  {
    overline: "We're hiring",
    title: 'Work With Us',
    body: (
      <>
        <div className="lp-about-job-title">Student Internship (part-time)</div>
        <p>
          We're looking for an intern who's genuinely excited about startups and building things from the ground up. You'll work closely with our CEO &amp; Founder, getting hands-on experience across the business from research and growth strategies to operations, project coordination, and fundraising. This is a remote role, but bonus points if you're in SF or Berkeley.
        </p>
        <p className="lp-about-apply"><em>Apply here.</em></p>
      </>
    ),
  },
];

function AboutPage() {
  usePageMeta({
    title: 'About Cherrytree — Fair Cofounder Agreements for Startups',
    description: 'Learn how Cherrytree helps early-stage cofounders create fair agreements that protect both equity stakes and relationships. Built by founders, for founders.',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'About' }],
  });

  const sectionRefs = useRef([]);

  // Reveal each about-section as it scrolls into view, staggered by index
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    sectionRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.transitionDelay = `${i * 0.12}s`;
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp lp-about-page">
      <MarketingGrain />
      <MarketingNav />

      <section className="lp-about-hero">
        <h1>Big ideas grow<br /><em>with the right company.</em></h1>
      </section>

      <div className="lp-about-sections">
        {SECTIONS.map((s, i) => (
          <div key={i} className="lp-about-section" ref={el => sectionRefs.current[i] = el}>
            <div className="lp-about-section-left">
              <div className="lp-about-section-overline">{s.overline}</div>
              <div className="lp-about-section-title">{s.title}</div>
            </div>
            <div className="lp-about-section-right">{s.body}</div>
          </div>
        ))}
      </div>

      <MarketingFooter />
    </div>
  );
}

export default AboutPage;
