import React, { useEffect } from 'react';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Footer from '../components/Footer';

function ContactPage() {
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

  // Load Tally embed script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="hero-content">
            <h1 className="font-heading text-[56px] font-normal mb-6">
              Contact Us<span style={{ marginLeft: '0.05em' }}>.</span>
            </h1>
            <p className="text-[16px] font-normal" style={{ color: '#716B6B' }}>
              We'd love to hear from you
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="scroll-section pb-8 px-6">
        <div className="max-w-4xl mx-auto">
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
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default ContactPage;
