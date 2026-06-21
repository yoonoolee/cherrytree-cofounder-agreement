import React from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';
import MarketingGrain from '../components/MarketingGrain';

const ATTORNEYS = [
  { id: 1, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Experienced attorney specializing in startup law and corporate formation.' },
  { id: 2, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Focused on intellectual property and technology transactions.' },
  { id: 3, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Expert in venture capital financing and founder agreements.' },
  { id: 4, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Specializing in business formation and contract negotiations.' },
  { id: 5, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Dedicated to helping early-stage startups navigate legal challenges.' },
  { id: 6, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Provides counsel on equity structures and founder disputes.' },
  { id: 7, name: 'Attorney Name', title: 'Practice Area', location: 'Location', description: 'Experienced in corporate governance and regulatory compliance.' },
];

function AttorneyPage() {
  usePageMeta({
    title: 'Attorney Review — Cherrytree',
    description: 'Get your cofounder agreement reviewed by experienced attorneys. Professional legal support to ensure your startup agreements are fair and enforceable.',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Attorney' }],
  });

  return (
    <div className="lp" style={{ minHeight: '100vh' }}>
      <MarketingGrain />
      <MarketingNav />

      {/* Hero */}
      <section className="lp-page-hero">
        <div className="lp-overline">Attorney Review</div>
        <h1 className="lp-page-h1">Attorney.</h1>
        <p className="lp-page-sub">Coming soon — this is only for Pro members.</p>
      </section>

      {/* Attorney grid */}
      <section className="lp-page-section">
        <div className="lp-attorney-grid">
          {ATTORNEYS.map((a) => (
            <div key={a.id} className="lp-attorney-card">
              <div className="lp-attorney-photo" />
              <div className="lp-attorney-name">{a.name}</div>
              <div className="lp-attorney-title">{a.title}</div>
              <div className="lp-attorney-location">{a.location}</div>
              <p className="lp-attorney-desc">{a.description}</p>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

export default AttorneyPage;
