import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Footer from '../components/Footer';

function PricingPage() {
  const navigate = useNavigate();
  useScrollAnimation();
  const [openFaq, setOpenFaq] = useState(null);

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

  const faqs = [
    {
      q: `Which plan is right for me?`,
      a: `If your cofoundership is fairly simple, get the Starter plan. You simply fill out a survey and receive a ready-to-use cofounder agreement. If your cofoundership is a little more complex, or if you like to be extra sure, get the Pro plan. You'll get an attorney to review the final doc and a cofounder coach to guide you through the whole process without the guesswork.`
    },
    {
      q: `Is the price per agreement or per person?`,
      a: `The price covers one agreement. You can add as many cofounders as you want, even on the Starter plan. Only one person pays; they invite everyone else. If you launch another company later and need a new agreement, that'll be a separate purchase.`
    },
    {
      q: `Do you offer discounts?`,
      a: `If you're currently a student, reach out to tim@cherrytree.app with your .edu email and we'll get you a discount.`
    },
    {
      q: `Can we upgrade anytime?`,
      a: `Yes, if you start with Starter but realize partway that you actually want an attorney to review, you can upgrade to the Pro plan.`
    },
    {
      q: `Do we pay again if we need to edit the agreement later?`,
      a: `No, edit all you want. The only repeat cost is if you create a brand-new agreement for a different company.`
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
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
                  onClick={() => {
                    // Navigate directly to my.cherrytree.app to avoid double redirect
                    const isProduction = window.location.hostname.includes('cherrytree.app');
                    if (isProduction) {
                      window.location.href = 'https://my.cherrytree.app/dashboard';
                    } else {
                      navigate('/dashboard');
                    }
                  }}
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
          <div className="mt-24">
            <h2 className="font-heading text-[46px] font-normal text-center mb-4">
              Compare plans<span style={{ marginLeft: '0.05em' }}>.</span>
            </h2>
            <p className="text-center text-[16px] mb-12 font-normal" style={{ color: '#716B6B' }}>
              Each pricing plan covers one cofounder agreement. Fill out the survey<br />and equity calculator to get a ready-to-use cofounder agreement.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 bg-white">Features</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900 bg-white">Starter</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900 bg-gray-50">Pro</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900 bg-white">Enterprise</th>
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

          {/* FAQ Section */}
          <div className="mt-48 pb-24">
            <h2 className="font-heading text-[46px] font-normal text-center mb-16">
              FAQs<span style={{ marginLeft: '0.05em' }}>.</span>
            </h2>

            <div className="max-w-3xl mx-auto">
              {faqs.map((faq, i) => (
                <div key={i} className="accordion-item border-b border-gray-300">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="accordion-title w-full py-5 px-4 flex justify-between items-center transition hover:bg-gray-50 text-left"
                  >
                    <span className="font-medium text-black">{faq.q}</span>
                    <span className={`accordion-icon text-gray-400 font-light transition-all duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-90 scale-110 text-gray-700' : ''}`}>
                      +
                    </span>
                  </button>
                  <div
                    className={`accordion-content overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-[1000px] py-8 px-4' : 'max-h-0 py-0 px-4'}`}
                  >
                    <p className="text-gray-600 text-[0.95rem]">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default PricingPage;
