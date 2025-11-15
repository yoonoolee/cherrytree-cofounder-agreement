import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Footer from '../components/Footer';

function PricingPage() {
  const navigate = useNavigate();
  useScrollAnimation();

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$200',
      description: 'For individuals to get started',
      features: [
        'Equity & vesting schedules',
        'Roles & responsibilities',
        'Contingencies & scenarios',
        'Decision-making & voting',
        'Intellectual property',
        'Buyout and exit terms',
        'And more…'
      ]
    },
    {
      name: 'Pro',
      price: '$800',
      description: 'Everything in Starter, plus',
      features: [
        'Reviewed by an attorney',
        'Advanced legal clauses',
        'Priority customer support',
        'Cofounder coaching'
      ],
      featured: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For investors and schools',
      features: [
        'Bulk licensing',
        'White-label options',
        'Custom integrations',
        'Dedicated account manager'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Pricing Section */}
      <section className="scroll-section pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-medium text-center mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Simple, transparent pricing
          </h1>
          <p className="text-center text-gray-600 mb-16" style={{ fontFamily: 'Inter, sans-serif' }}>
            Choose the plan that's right for your team
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`bg-white p-8 rounded-lg ${
                  plan.featured
                    ? 'ring-2 ring-[#000000] shadow-lg scale-105'
                    : 'shadow-sm border border-gray-200'
                }`}
              >
                {plan.featured && (
                  <div className="text-[#000000] text-sm font-semibold mb-2">MOST POPULAR</div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-2">{plan.price}</div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-[#000000] mt-1">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    plan.featured
                      ? 'bg-[#000000] text-white hover:bg-[#1a1a1a]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Get started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default PricingPage;
