import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [user, setUser] = useState(null);
  const [typedText, setTypedText] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [cardTilt, setCardTilt] = useState(15);
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
      }, 80);
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

  // Scroll-based step detection
  useEffect(() => {
    const handleScroll = () => {
      const panels = document.querySelectorAll('.step-panel');

      panels.forEach((panel, index) => {
        const rect = panel.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Check if panel is in the center of viewport
        if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
          setActiveStep(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tilt card scroll effect
  useEffect(() => {
    const handleTiltScroll = () => {
      const card = document.querySelector('.tilty-card');
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate how far the card has scrolled into view
      // Fully straight when card is fully visible in viewport
      const scrollProgress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight * 0.7)));

      // Interpolate tilt from 15deg to 0deg based on scroll progress
      const tiltValue = 15 * (1 - scrollProgress);
      setCardTilt(tiltValue);
    };

    window.addEventListener('scroll', handleTiltScroll);
    handleTiltScroll(); // Call once on mount

    return () => window.removeEventListener('scroll', handleTiltScroll);
  }, []);

  const steps = [
    {
      step: '1',
      title: 'Answer a few questions',
      desc: 'Who does what, who owns what, and what you each bring to the table.'
    },
    {
      step: '2',
      title: 'Smooth things out',
      desc: 'We show you where you\'re not aligned before it turns into "we need to talk."'
    },
    {
      step: '3',
      title: 'Seal the deal',
      desc: 'Get a legit cofounder agreement. No $600/hr lawyers, no 2 a.m. screaming.'
    }
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
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black"/>
              </svg>
              <span className="text-base font-semibold">Cherrytree</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2 text-sm">
              <button onClick={() => navigate('/equity-calculator')} className="text-[#808080] hover:text-black transition">Equity Calculator</button>
              <a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-[#808080] hover:text-black transition">Newsletter</a>
              <button onClick={() => navigate('/pricing')} className="text-[#808080] hover:text-black transition">Pricing</button>
              <button onClick={() => navigate('/about')} className="text-[#808080] hover:text-black transition">About</button>
            </nav>

            <div className="hidden md:flex items-center gap-4 text-sm">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-[#808080] hover:text-black transition"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#808080] hover:text-black transition"
                >
                  Login
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="button-shimmer bg-[#000000] text-white px-5 py-1.5 rounded-md hover:bg-[#1a1a1a] transition"
              >
                Create agreement
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-heading text-[72px] font-normal text-gray-900 mb-6 min-h-[140px]">
            Great companies start
            <br />
            <em className="italic">{typedText || '\u00A0'}</em>
          </h1>
          <p className="text-[16px] mb-16 max-w-2xl mx-auto font-normal" style={{ color: '#716B6B' }}>
            Create fair agreements to safeguard both your stake<br />and your relationships. You and your cofounder deserve it.
          </p>
          <div className="flex flex-col items-center gap-3 mb-12">
            <button
              onClick={() => navigate('/dashboard')}
              className="button-shimmer bg-[#000000] text-white px-16 py-4 rounded-md text-[16px] font-normal hover:bg-[#1a1a1a] transition"
            >
              Create agreement
            </button>
            <p className="text-sm text-gray-600">
              or <a href="#" className="underline hover:text-gray-900 font-semibold">Book a Free Consultation</a>
            </p>
          </div>

          {/* Logo Carousel */}
          <div className="logo-scroller">
            <div className="logo-track">
              <div className="logo-box"><img src="https://i-p.rmcdn.net/628697f4bb204c00329fc3ff/3678102/image-ebaf55a8-a29f-4b96-a4dd-511a1b997a9f.png" alt="Client 1" /></div>
              <div className="logo-box"><img src="https://app.hubble.social/images/Hubble_Logo_Metadata.png" alt="Client 2" /></div>
              <div className="logo-box"><img src="https://1000logos.net/wp-content/uploads/2024/10/A16z-Logo.jpg" alt="Client 3" /></div>
              <div className="logo-box"><img src="https://s8968.pcdn.co/crae/wp-content/uploads/sites/3/2017/07/berkeley-logo.png" alt="Client 4" /></div>
              <div className="logo-box"><img src="https://widelensleadership.com/wp-content/uploads/2020/10/stanford-bw-logo.png" alt="Client 5" /></div>
              <div className="logo-box"><img src="https://meta-q.cdn.bubble.io/f1709745653083x789810065436331800/sg-stacked-black.svg" alt="Client 6" /></div>
              <div className="logo-box"><img src="https://miro.medium.com/v2/resize:fit:1400/1*g8ke5RY7vcZvtxV-1t6ibw.png" alt="Client 7" /></div>

              {/* duplicate logos for seamless scroll */}
              <div className="logo-box"><img src="https://i-p.rmcdn.net/628697f4bb204c00329fc3ff/3678102/image-ebaf55a8-a29f-4b96-a4dd-511a1b997a9f.png" alt="Client 1" /></div>
              <div className="logo-box"><img src="https://app.hubble.social/images/Hubble_Logo_Metadata.png" alt="Client 2" /></div>
              <div className="logo-box"><img src="https://1000logos.net/wp-content/uploads/2024/10/A16z-Logo.jpg" alt="Client 3" /></div>
              <div className="logo-box"><img src="https://s8968.pcdn.co/crae/wp-content/uploads/sites/3/2017/07/berkeley-logo.png" alt="Client 4" /></div>
              <div className="logo-box"><img src="https://widelensleadership.com/wp-content/uploads/2020/10/stanford-bw-logo.png" alt="Client 5" /></div>
              <div className="logo-box"><img src="https://meta-q.cdn.bubble.io/f1709745653083x789810065436331800/sg-stacked-black.svg" alt="Client 6" /></div>
              <div className="logo-box"><img src="https://miro.medium.com/v2/resize:fit:1400/1*g8ke5RY7vcZvtxV-1t6ibw.png" alt="Client 7" /></div>
            </div>
          </div>

          {/* Tilted Card */}
          <div className="mt-4" style={{ perspective: '1000px' }}>
            <div
              className="tilty-card mx-auto"
              style={{
                width: '1100px',
                height: '619px',
                maxWidth: '90vw',
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                transform: `rotateX(${cardTilt}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s ease-out',
                display: 'block',
                padding: '48px'
              }}
            >
              <h3 className="text-3xl font-bold mb-4 text-center">Your Agreement, Your Way</h3>
              <p className="text-gray-600 text-center max-w-2xl mx-auto">
                Every startup is unique. Our platform adapts to your specific situation,
                ensuring your cofounder agreement reflects your team's values and goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="sticky top-16 bg-white z-20 pb-8 pt-8">
            <h2 className="font-heading text-[46px] font-medium text-center mb-4">
              Built for <span className="underline-animate">early-stage
                <svg viewBox="0 0 250 12" preserveAspectRatio="none">
                  <path d="M 3,10 Q 60,6 125,4 Q 190,3 245,3 Q 250,4 228,6" />
                </svg>
              </span> cofounders.
            </h2>
            <p className="text-[16px] text-center max-w-3xl mx-auto font-normal" style={{ color: '#716B6B' }}>
              Get your equity, expectations, and everything else right from the start.
            </p>
          </div>

          <div className="relative">
            {/* Sticky Card - overlays all panels */}
            <div className="absolute top-0 left-0 right-0 h-[300vh] pointer-events-none">
              <div className="sticky top-[240px] max-w-4xl mx-auto pointer-events-auto">
                <div className="bg-white rounded-lg p-12 transition-all duration-500">
                  <h3 className="text-[22px] font-medium mb-1">{steps[activeStep].title}</h3>
                  <p className="text-gray-600 mb-8">{steps[activeStep].desc}</p>
                  {/* Space for image */}
                  <div className="bg-gray-100 rounded-lg h-[300px] flex items-center justify-center">
                    <p className="text-gray-400">Image goes here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invisible scroll panels - full viewport height each, stacked vertically */}
            <div className="step-panel h-screen"></div>
            <div className="step-panel h-screen"></div>
            <div className="step-panel h-screen"></div>
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
          <p className="text-center text-[16px] mb-16 font-normal" style={{ color: '#716B6B' }}>Choose the plan that's right for your team</p>

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
      <section className="py-20 px-6 bg-white text-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-4xl font-medium mb-6">
            Protect your piece of the pie<br />your peace of mind.
          </h2>
          <p className="text-xl mb-8 text-gray-600 font-normal">
            Join thousands of founders who've secured their partnerships
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="button-shimmer bg-[#000000] text-white px-8 py-4 rounded-md text-lg font-semibold hover:bg-[#1a1a1a] transition"
          >
            Create your agreement today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-gray-600 pt-80 pb-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="24" height="24" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="black"/>
              </svg>
              <span className="text-black font-semibold">Cherrytree</span>
            </div>
            <p className="text-sm">Cofounder coaching for early-stage teams</p>
          </div>

          <div>
            <h4 className="text-black font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-black transition">Contract Creator</button></li>
              <li><button onClick={() => navigate('/equity-calculator')} className="hover:text-black transition">Equity Calculator</button></li>
              <li><button onClick={() => navigate('/pricing')} className="hover:text-black transition">Pricing</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-black font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="hover:text-black transition">Newsletter</a></li>
              <li><a href="#" className="hover:text-black transition">Coaching</a></li>
              <li><a href="#" className="hover:text-black transition">Attorney Services</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-black font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/about')} className="hover:text-black transition">About</button></li>
              <li><a href="#" className="hover:text-black transition">Contact</a></li>
              <li><a href="#" className="hover:text-black transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-black transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-200 text-sm text-center">
          © {new Date().getFullYear()} Cherrytree. All rights reserved.
        </div>
      </footer>

      <style jsx>{`
        .logo-scroller {
          position: relative;
          overflow: hidden;
          width: 100%;
          background: #fff;
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .logo-track {
          display: flex;
          width: calc(200%);
          animation: scroll 30s linear infinite;
        }

        .logo-box {
          flex: 0 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 40px;
        }

        .logo-box img {
          max-height: 36px;
          max-width: 120px;
          object-fit: contain;
        }

        .logo-scroller {
          padding: 20px 0;
        }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .logo-track {
            animation: scroll 15s linear infinite;
          }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
