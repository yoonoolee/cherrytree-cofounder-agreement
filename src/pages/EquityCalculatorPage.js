import React from 'react';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Footer from '../components/Footer';

function EquityCalculatorPage() {
  useScrollAnimation();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Content */}
      <section className="scroll-section pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-medium mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Equity Calculator
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            Coming soon...
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default EquityCalculatorPage;
