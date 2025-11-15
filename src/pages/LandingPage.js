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
  const [activeFeature, setActiveFeature] = useState(0);
  const [showSecondImage, setShowSecondImage] = useState(false);
  const [shrinkFirst, setShrinkFirst] = useState(false);
  const [typedAnd, setTypedAnd] = useState('');
  const fullText = 'with great company.';
  const andText = 'and';

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

  // Feature animation for Contract Creator
  useEffect(() => {
    if (activeFeature !== 0) return;

    const runAnimation = () => {
      setShrinkFirst(false);
      setShowSecondImage(false);

      setTimeout(() => setShrinkFirst(false), 500);
      setTimeout(() => setShrinkFirst(true), 2000);
      setTimeout(() => setShowSecondImage(true), 2300);
      setTimeout(() => {
        setShrinkFirst(false);
        setShowSecondImage(false);
      }, 4500);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 5700);
    return () => clearInterval(interval);
  }, [activeFeature]);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 11400);
    return () => clearInterval(interval);
  }, []);

  // Typing animation for "and"
  useEffect(() => {
    const typeLoop = () => {
      let index = 0;
      const type = () => {
        if (index < andText.length) {
          index++;
          setTypedAnd(andText.slice(0, index));
          setTimeout(type, 200);
        } else {
          setTimeout(() => {
            setTypedAnd('');
            setTimeout(typeLoop, 200);
          }, 1000);
        }
      };
      type();
    };

    const initialTimeout = setTimeout(typeLoop, 50);
    return () => clearTimeout(initialTimeout);
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
      description: 'Generate a ready-to-use, fully customized document in minutes and start building your partnership with confidence.',
      id: 'contract-creator'
    },
    {
      title: 'Equity Calculator',
      description: 'Use our AI to calculate equity without the guesswork. Get precise, fair equity splits instantly, so everyone knows where they stand.',
      id: 'equity-calculator'
    },
    {
      title: 'Expert Guidance',
      description: 'Cofounder coaches and attorneys ready to help. We are here to guide you every step of the way.',
      id: 'expert-guidance'
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
      q: 'What\'s a cofounder agreement, and why do I need one?',
      a: 'It\'s basically a prenup for your startup. It spells out equity, roles, and expectations so you don\'t end up in a messy breakup later. Think of it as cheap insurance against expensive fights.'
    },
    {
      q: 'When\'s the right time to create a cofounder agreement?',
      a: 'As early as possible. Day one is ideal, but day 100 is still better than never. The earlier you do it, the easier (and less awkward) it is.'
    },
    {
      q: 'How long does it take to complete with Cherrytree?',
      a: 'Around 30-60 minutes. That\'s less time than a pitch deck tweak or your daily doomscroll.'
    },
    {
      q: 'Can I update the agreement later if things change?',
      a: 'Absolutely. Startups evolve, and so can your agreement. You can revisit and revise as roles, equity, or goals shift.'
    },
    {
      q: 'How is Cherrytree different from free templates online?',
      a: 'Templates are generic and don\'t ask the hard questions. Cherrytree guides you step by step, highlights differences in answers, and gives you a founder-friendly, investor-ready document.'
    },
    {
      q: 'Do both cofounders need to be present at the same time?',
      a: 'Nope. You can each fill it out separately, then compare and finalize together.'
    },
    {
      q: 'Can we e-sign the agreement once it\'s done?',
      a: 'Yes. You\'ll get a ready-to-sign document you can execute digitally. No printer required.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/images/cherrytree-logo.png"
                alt="Cherrytree"
                style={{ height: '32px', width: 'auto' }}
              />
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
              <div className="logo-box"><img src="/images/yc-logo.png" alt="Y Combinator" /></div>
              <div className="logo-box"><img src="/images/hubble-logo.png" alt="Hubble" /></div>
              <div className="logo-box"><img src="/images/a16z-logo.jpg" alt="a16z" /></div>
              <div className="logo-box"><img src="/images/berkeley-logo.png" alt="Berkeley" /></div>
              <div className="logo-box"><img src="/images/stanford-logo.png" alt="Stanford" /></div>
              <div className="logo-box"><img src="/images/sequoia-logo.png" alt="Sequoia" /></div>
              <div className="logo-box"><img src="/images/startupgrind-logo.png" alt="Startup Grind" /></div>

              {/* duplicate logos for seamless scroll */}
              <div className="logo-box"><img src="/images/yc-logo.png" alt="Y Combinator" /></div>
              <div className="logo-box"><img src="/images/hubble-logo.png" alt="Hubble" /></div>
              <div className="logo-box"><img src="/images/a16z-logo.jpg" alt="a16z" /></div>
              <div className="logo-box"><img src="/images/berkeley-logo.png" alt="Berkeley" /></div>
              <div className="logo-box"><img src="/images/stanford-logo.png" alt="Stanford" /></div>
              <div className="logo-box"><img src="/images/sequoia-logo.png" alt="Sequoia" /></div>
              <div className="logo-box"><img src="/images/startupgrind-logo.png" alt="Startup Grind" /></div>
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
              </span> cofounders<span style={{ marginLeft: '0.05em' }}>.</span>
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
          <h2 className="font-heading text-[46px] font-medium text-center mb-16">Turn your cofoundership into a company, today<span style={{ marginLeft: '0.05em' }}>.</span></h2>

          <div className="features-container">
            <div className="features-left">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`feature-card ${activeFeature === i ? 'active' : ''}`}
                  onClick={() => setActiveFeature(i)}
                >
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className={`feature-description ${activeFeature === i ? 'active' : ''}`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="feature-visual">
              {/* Contract Creator - Dual Image */}
              <div
                className={`visual-content ${activeFeature === 0 ? 'active' : ''}`}
                id="contract-creator"
                style={{
                  opacity: activeFeature === 0 && !showSecondImage ? 1 : 0,
                  transform: shrinkFirst ? 'translateX(-73%) scale(0.75)' : 'translateX(-50%) scale(1)',
                  display: activeFeature === 0 ? 'flex' : 'none'
                }}
              >
                <img src="https://i.imgur.com/UkaZJir.png" alt="Contract Creator" />
              </div>
              <div
                className={`visual-content ${showSecondImage ? 'visible' : ''}`}
                id="contract-creator-secondary"
                style={{
                  opacity: showSecondImage ? 1 : 0,
                  display: activeFeature === 0 ? 'flex' : 'none'
                }}
              >
                <img src="https://i.imgur.com/UkaZJir.png" alt="Contract Creator Secondary" />
              </div>

              {/* Equity Calculator */}
              <div
                className={`visual-content ${activeFeature === 1 ? 'active' : ''}`}
                id="equity-calculator"
                style={{
                  opacity: activeFeature === 1 ? 1 : 0,
                  display: activeFeature === 1 ? 'flex' : 'none'
                }}
              >
                <img src="https://i.imgur.com/MkNDfYx.gif" alt="Equity Calculator" />
              </div>

              {/* Expert Guidance */}
              <div
                className={`visual-content ${activeFeature === 2 ? 'active' : ''}`}
                id="expert-guidance"
                style={{
                  opacity: activeFeature === 2 ? 1 : 0,
                  display: activeFeature === 2 ? 'flex' : 'none'
                }}
              >
                <img src="https://i.imgur.com/UkaZJir.png" alt="Expert Guidance" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-[46px] font-medium text-center mb-4">Pricing<span style={{ marginLeft: '0.05em' }}>.</span></h2>
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
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-16 items-start">
            <div className="flex-shrink-0">
              <h2 className="font-heading text-[46px] font-medium">FAQs<span style={{ marginLeft: '0.05em' }}>.</span></h2>
            </div>
            <div className="flex-1 max-w-[700px]">
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
                    className={`accordion-content overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-[1000px] py-4 px-4' : 'max-h-0 py-0 px-4'}`}
                  >
                    <p className="text-gray-600 text-[0.95rem]">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-white text-gray-900">
        <div className="headline-container">
          <h1 className="typing-title font-heading">
            <span className="first-line">Protect your piece of the pie</span>
            <span className="second-line">
              <span className="typing-container">
                <em className="typing-and">{typedAnd || '\u00A0'}</em>
              </span> your peace of mind.
            </span>
          </h1>
        </div>
        <div className="max-w-4xl mx-auto text-center mt-16">
          <div className="flex flex-col items-center gap-3">
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
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black text-white pt-24 pb-20 px-6">
        {/* Rounded top border */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-white rounded-b-[48px]"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            {/* Left side - Logo and copyright */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg width="32" height="32" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                  <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="white"/>
                </svg>
                <span className="text-white text-xl font-semibold">Cherrytree</span>
              </div>
              <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Cherrytree</p>
            </div>

            {/* Right side - Three columns */}
            <div className="grid grid-cols-3 gap-12 ml-auto">
              <div>
                <h4 className="text-white text-sm mb-4">Product</h4>
                <ul className="space-y-4 text-sm">
                  <li><button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition">Contract Creator</button></li>
                  <li><button onClick={() => navigate('/equity-calculator')} className="text-gray-400 hover:text-white transition">Equity Calculator</button></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Compatibility Quiz</a></li>
                  <li><button onClick={() => navigate('/pricing')} className="text-gray-400 hover:text-white transition">Pricing</button></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white text-sm mb-4">Resources</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Newsletter</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Coaching</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Attorney</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white text-sm mb-4">Company</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Terms</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
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

        /* Features Section Styles */
        .features-container {
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .features-left, .feature-visual {
          flex: 1 1 0;
          min-width: 300px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .features-left {
          gap: 12px;
        }

        .feature-card {
          background: #f7f7f7;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 32px;
          cursor: pointer;
          transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 160px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          text-align: left;
        }

        .feature-card:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border-color: #e8e8e8;
        }

        .feature-card.active {
          border-color: #e8e8e8;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }

        .feature-title {
          font-family: 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 500;
          color: #888888;
          margin: 0 0 16px 0;
          text-align: left;
          transition: color 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-card.active .feature-title {
          color: #333333;
        }

        .feature-description {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #666;
          line-height: 1.3;
          margin: 0 0 8px 0;
          opacity: 0;
          display: none;
          text-align: left;
          transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-description.active {
          display: block;
          opacity: 1;
        }

        .feature-visual {
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
          overflow: hidden;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 16px 32px;
          border: 12px solid #f7f7f7;
          min-height: calc(160px*3 + 24px);
          display: flex;
        }

        .visual-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4,0,0.2,1);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        #contract-creator {
          left: 50%;
          z-index: 2;
          transition: opacity 0.5s ease, transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #contract-creator-secondary {
          left: 50%;
          transform: translateX(-27%) scale(0.75);
          z-index: 1;
          transition: opacity 0.6s ease, transform 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #contract-creator img,
        #contract-creator-secondary img {
          width: 390px;
          height: 568px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #ccc;
          background: #fff;
        }

        #equity-calculator img,
        #expert-guidance img {
          width: 390px;
          height: 568px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #ccc;
          background: #fff;
        }

        #equity-calculator img {
          width: 85%;
          height: auto;
          max-height: 85%;
          object-fit: contain;
        }

        @media (max-width: 968px) {
          .features-container {
            flex-direction: column;
          }
          .feature-visual {
            min-height: auto;
          }
        }

        /* Typing Headline Styles */
        .headline-container {
          width: 100%;
          max-width: 90ch;
          padding: 0 1rem;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          text-align: center;
        }

        .typing-title {
          font-size: clamp(1.6rem, 5vw, 2.8rem);
          font-weight: 400;
          line-height: 1.2;
          margin: 0;
        }

        .first-line {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .second-line {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .typing-container {
          display: inline-block;
          width: 3ch;
          vertical-align: baseline;
        }

        .typing-and {
          display: inline-block;
          font-style: italic;
          font-family: inherit;
          font-weight: inherit;
          visibility: visible;
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
