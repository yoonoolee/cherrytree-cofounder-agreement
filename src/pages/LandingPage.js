import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [user, setUser] = useState(null);
  const [typedText, setTypedText] = useState('');
  const fullText = 'with great company.';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Typewriter effect for second line with loop
  useEffect(() => {
    if (typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 150);
      return () => clearTimeout(timeout);
    } else {
      // Reset after completion and pause
      const resetTimeout = setTimeout(() => {
        setTypedText('');
      }, 2000);
      return () => clearTimeout(resetTimeout);
    }
  }, [typedText]);

  // Auto-rotate feature tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const logos = [
    'Hubble', 'a16z', 'Berkeley', 'Stanford', 'Sequoia',
    'Y Combinator', 'MIT', 'Harvard', 'Techstars', 'Google'
  ];

  const features = [
    {
      title: 'Contract Creator',
      description: 'Generate customized cofounder agreements in minutes, not days. Our intelligent system asks the right questions to create documents tailored to your situation.',
      icon: '📄'
    },
    {
      title: 'Equity Calculator',
      description: 'AI-powered equity split calculator that considers multiple factors: time commitment, expertise, capital contribution, and opportunity cost to ensure fair distribution.',
      icon: '📊'
    },
    {
      title: 'Expert Guidance',
      description: 'Access to experienced cofounder coaches and attorney review. Get professional support when you need it most, without the enterprise price tag.',
      icon: '👥'
    }
  ];

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

  const faqs = [
    {
      q: 'When should I create a cofounder agreement?',
      a: 'Ideally before you start working together. The earlier the better - it prevents misunderstandings and protects everyone involved.'
    },
    {
      q: 'How long does it take to complete?',
      a: 'Most teams complete the questionnaire in 30-60 minutes. You can save and return anytime.'
    },
    {
      q: 'Can I update the agreement later?',
      a: 'Yes, circumstances change. We recommend reviewing and updating annually or when significant changes occur.'
    },
    {
      q: 'How is this different from templates?',
      a: 'Templates are one-size-fits-all. Our system asks targeted questions to create a customized agreement specific to your situation.'
    },
    {
      q: 'Do I need a lawyer?',
      a: 'Our Starter plan is legally sound for most teams. For complex situations or peace of mind, our Pro plan includes attorney review.'
    },
    {
      q: 'What if my cofounder disagrees on equity?',
      a: 'Our equity calculator and coaching services help facilitate fair conversations and find mutually agreeable solutions.'
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. We use enterprise-grade encryption and never share your information. Your data is stored securely on Firebase.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black"/>
              </svg>
              <span className="text-xl font-semibold">Cherrytree</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => navigate('/equity-calculator')} className="text-gray-600 hover:text-gray-900 transition">Equity Calculator</button>
              <a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition">Newsletter</a>
              <button onClick={() => navigate('/pricing')} className="text-gray-600 hover:text-gray-900 transition">Pricing</button>
              <button onClick={() => navigate('/about')} className="text-gray-600 hover:text-gray-900 transition">About</button>
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Login
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#000000] text-white px-6 py-2 rounded-lg hover:bg-[#1a1a1a] transition"
              >
                Create agreement
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-normal text-gray-900 mb-3 min-h-[120px] md:min-h-[140px]">
            Great companies start
            <br />
            <em className="italic">{typedText || '\u00A0'}</em>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-normal">
            Create fair agreements to safeguard both your stake and your relationships. You and your cofounder deserve it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#000000] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#1a1a1a] transition"
            >
              Create agreement
            </button>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition">
              Book Free Consultation
            </button>
          </div>

          {/* Logo Carousel */}
          <div className="relative overflow-hidden">
            <div className="flex gap-12 animate-scroll">
              {[...logos, ...logos].map((logo, i) => (
                <div key={i} className="text-gray-400 font-medium whitespace-nowrap">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl font-medium text-center mb-4">
            Built for <span className="underline-animate">early-stage
              <svg viewBox="0 0 250 12" preserveAspectRatio="none">
                <path d="M 3,10 Q 60,6 125,4 Q 190,3 245,3 Q 250,4 228,6" />
              </svg>
            </span> cofounders.
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto font-normal">
            Get your equity, expectations, and everything else right from the start.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Answer a few questions',
                desc: 'Tell us about your roles, ownership, and company goals'
              },
              {
                step: '2',
                title: 'Smooth things out',
                desc: 'We highlight potential issues before they become problems'
              },
              {
                step: '3',
                title: 'Seal the deal',
                desc: 'Get a customized, legally-sound cofounder agreement'
              }
            ].map((item) => (
              <div key={item.step} className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 bg-[#000000] text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl font-bold text-center mb-16">Everything you need</h2>

          {/* Feature Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            {features.map((feature, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  activeTab === i
                    ? 'bg-[#000000] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {feature.icon} {feature.title}
              </button>
            ))}
          </div>

          {/* Active Feature */}
          <div className="p-12 rounded-lg text-center">
            <div className="text-6xl mb-6">{features[activeTab].icon}</div>
            <h3 className="font-heading text-2xl font-bold mb-4">{features[activeTab].title}</h3>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              {features[activeTab].description}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl font-bold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-center text-gray-600 mb-16">Choose the plan that's right for your team</p>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`bg-white p-8 rounded-lg ${
                  plan.featured
                    ? 'ring-2 ring-[#000000] shadow-lg scale-105'
                    : 'shadow-sm'
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

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl font-bold text-center mb-16">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center transition"
                >
                  <span className="font-semibold">{faq.q}</span>
                  <span className="text-2xl text-gray-400">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-[#000000] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-4xl font-medium mb-6">
            Protect your piece of the pie<br />your peace of mind.
          </h2>
          <p className="text-xl mb-8 opacity-90 font-normal">
            Join thousands of founders who've secured their partnerships
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white text-[#000000] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
          >
            Create your agreement today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="24" height="24" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="white"/>
              </svg>
              <span className="text-white font-semibold">Cherrytree</span>
            </div>
            <p className="text-sm">Cofounder coaching for early-stage teams</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-white transition">Contract Creator</button></li>
              <li><button onClick={() => navigate('/equity-calculator')} className="hover:text-white transition">Equity Calculator</button></li>
              <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition">Pricing</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Newsletter</a></li>
              <li><a href="#" className="hover:text-white transition">Coaching</a></li>
              <li><a href="#" className="hover:text-white transition">Attorney Services</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/about')} className="hover:text-white transition">About</button></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800 text-sm text-center">
          © {new Date().getFullYear()} Cherrytree. All rights reserved.
        </div>
      </footer>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
