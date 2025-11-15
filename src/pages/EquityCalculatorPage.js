import React, { useEffect } from 'react';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Footer from '../components/Footer';

function EquityCalculatorPage() {
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Content */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="hero-content">
            <h1 className="font-heading text-[56px] font-normal mb-6">
              Equity Calculator<span style={{ marginLeft: '0.05em' }}>.</span>
            </h1>
            <p className="text-[16px] font-normal" style={{ color: '#716B6B' }}>
              Coming soon...
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default EquityCalculatorPage;
