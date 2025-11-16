import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Footer from '../components/Footer';

function PricingPage() {
  const navigate = useNavigate();
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

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$200',
      description: 'For individuals to get started',
      features: [
        'Real-time collaboration',
        'Instant agreement from survey',
        'Unlimited collaborators'
      ]
    },
    {
      name: 'Pro',
      price: '$800',
      description: 'Everything in Starter, plus',
      features: [
        'Advanced legal clauses',
        'Attorney review',
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
        'White label option',
        'Priority support'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Pricing Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="hero-content text-center mb-16">
            <h1 className="font-heading text-[56px] font-normal mb-6">
              Simple, transparent pricing<span style={{ marginLeft: '0.05em' }}>.</span>
            </h1>
            <p className="text-[16px] font-normal" style={{ color: '#716B6B' }}>
              Choose the plan that's right for your team.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`bg-white p-8 rounded-lg flex flex-col ${
                  plan.featured
                    ? 'ring-2 ring-gray-700'
                    : 'border border-gray-400'
                }`}
              >
                <h3 className="text-xl font-normal mb-2 text-[#716B6B]">{plan.name}</h3>
                <div className="text-4xl font-bold mb-2">{plan.price}</div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`w-full py-3 rounded-lg font-semibold transition mb-6 ${
                    plan.featured
                      ? 'button-shimmer bg-[#000000] text-white hover:bg-[#1a1a1a]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Get started
                </button>
                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-[#716B6B] mt-1">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-60">
            <h2 className="font-heading text-[46px] font-normal text-center mb-4">
              Compare plans<span style={{ marginLeft: '0.05em' }}>.</span>
            </h2>
            <p className="text-center text-[16px] mb-12 font-normal" style={{ color: '#716B6B' }}>
              Each pricing plan covers one cofounder agreement. Fill out the survey<br />and equity calculator to get a ready-to-use cofounder agreement.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Starter</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900 bg-gray-50">Pro</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Agreement Features */}
                  <tr className="border-b border-gray-100">
                    <td colSpan="4" className="py-4 px-6 font-semibold text-gray-900 bg-gray-50">
                      Agreement Features
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Equity & vesting schedules</td>
                    <td className="text-center py-4 px-6">✓</td>
                    <td className="text-center py-4 px-6 bg-gray-50">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Roles & responsibilities</td>
                    <td className="text-center py-4 px-6">✓</td>
                    <td className="text-center py-4 px-6 bg-gray-50">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Intellectual property</td>
                    <td className="text-center py-4 px-6">✓</td>
                    <td className="text-center py-4 px-6 bg-gray-50">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Decision-making & voting</td>
                    <td className="text-center py-4 px-6">✓</td>
                    <td className="text-center py-4 px-6 bg-gray-50">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Advanced legal clauses</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-gray-50">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>

                  {/* Support */}
                  <tr className="border-b border-gray-100">
                    <td colSpan="4" className="py-4 px-6 font-semibold text-gray-900 bg-gray-50">
                      Support
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Email support</td>
                    <td className="text-center py-4 px-6">✓</td>
                    <td className="text-center py-4 px-6 bg-gray-50">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Priority support</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-gray-50">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Attorney review</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-gray-50">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Cofounder coaching</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-gray-50">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Dedicated account manager</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-gray-50">-</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>

                  {/* Enterprise Features */}
                  <tr className="border-b border-gray-100">
                    <td colSpan="4" className="py-4 px-6 font-semibold text-gray-900 bg-gray-50">
                      Enterprise Features
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Bulk licensing</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-gray-50">-</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">White-label options</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-gray-50">-</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Custom integrations</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-gray-50">-</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default PricingPage;
