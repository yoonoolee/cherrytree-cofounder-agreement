import React, { useEffect } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';
import MarketingGrain from '../components/MarketingGrain';

function ContactPage() {
  usePageMeta({
    title: 'Contact Us — Cherrytree',
    description: "We'd love to hear from you. Get in touch with the Cherrytree team.",
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Contact' }],
  });

  // Re-inject the Tally embed script so it re-scans for [data-tally-src] on this
  // client-side route (the global script tag in index.html only runs once on load).
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return (
    <div className="lp" style={{ minHeight: '100vh' }}>
      <MarketingGrain />
      <MarketingNav />

      {/* Hero */}
      <section className="lp-page-hero">
        <div className="lp-overline">Contact</div>
        <h1 className="lp-page-h1">Get in touch.</h1>
        <p className="lp-page-sub">We'd love to hear from you.</p>
      </section>

      {/* Form */}
      <section className="lp-page-section">
        <iframe
          data-tally-src="https://tally.so/r/2EEB99?transparentBackground=1"
          width="100%"
          height="800"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          title="Contact Us"
          style={{ border: 0 }}
        />
      </section>

      <MarketingFooter />
    </div>
  );
}

export default ContactPage;
