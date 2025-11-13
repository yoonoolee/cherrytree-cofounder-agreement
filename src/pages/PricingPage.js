import React from 'react';
import { useNavigate } from 'react-router-dom';

function PricingPage() {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <svg width="32" height="32" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black"/>
              </svg>
              <span className="text-xl font-semibold">Cherrytree</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="pt-32 pb-20 px-6">
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
    </div>
  );
}

export default PricingPage;
