import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Footer from '../components/Footer';

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
  const [typedToday, setTypedToday] = useState('');
  const fullText = 'with great company.';
  const andText = 'and';
  const todayText = 'today.';

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

  // Typewriter effect for "today" with loop
  useEffect(() => {
    if (typedToday.length < todayText.length) {
      const timeout = setTimeout(() => {
        setTypedToday(todayText.slice(0, typedToday.length + 1));
      }, 80);
      return () => clearTimeout(timeout);
    } else {
      // Reset after completion and pause
      const resetTimeout = setTimeout(() => {
        setTypedToday('');
      }, 2000);
      return () => clearTimeout(resetTimeout);
    }
  }, [typedToday]);

  // Scroll-based step detection with stacking card animation
  const [cardOffsets, setCardOffsets] = useState([0, 0, 0]);

  useEffect(() => {
    const handleScroll = () => {
      const sectionElement = document.querySelector('.process-section');
      if (!sectionElement) return;

      const rect = sectionElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // The sticky container has top-[120px], so it becomes sticky at rect.top = 120
      // We only start animating cards AFTER the section has settled at this sticky position
      // This ensures the "Built for early-stage cofounders" heading is already at the top
      // before cards start revealing
      const settlingPoint = 120;

      let scrollProgress = 0;

      if (rect.top <= settlingPoint) {
        // Section has reached its sticky position, now calculate animation progress
        // based on how much further the user has scrolled
        const scrollDistance = settlingPoint - rect.top;
        const totalScrollRange = windowHeight * 1.0;
        scrollProgress = Math.max(0, Math.min(1, scrollDistance / totalScrollRange));
      }

      // Card height + spacing (approximate)
      const cardHeight = 280; // Approximate height of each card
      const spacing = 10; // Gap between cards when spread out

      // Calculate offsets for each card based on scroll progress
      // Card 1: Always at top (offset 0)
      // Card 2: Slides down early (10-40% of scroll progress)
      // Card 3: Slides down next (40-70% of scroll progress)

      const card2Progress = Math.max(0, Math.min(1, (scrollProgress - 0.1) / 0.3));
      const card3Progress = Math.max(0, Math.min(1, (scrollProgress - 0.4) / 0.3));

      const newOffsets = [
        0,
        card2Progress * (cardHeight + spacing),
        card2Progress * (cardHeight + spacing) + card3Progress * (cardHeight + spacing)
      ];

      setCardOffsets(newOffsets);

      // Set active step based on which card is most "revealed"
      if (scrollProgress < 0.3) setActiveStep(0);
      else if (scrollProgress < 0.6) setActiveStep(1);
      else setActiveStep(2);
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

  // Scroll-triggered section animations
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

  // Special early trigger for process section
  useEffect(() => {
    const earlyObserverOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const earlyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          earlyObserver.unobserve(entry.target);
        }
      });
    }, earlyObserverOptions);

    const earlySections = document.querySelectorAll('.scroll-section-early');
    earlySections.forEach(section => earlyObserver.observe(section));

    // Observe underline animation
    const underlineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Only start the delay timer when section is visible
          setTimeout(() => {
            entry.target.classList.add('underline-visible');
          }, 500);
          underlineObserver.unobserve(entry.target);
        }
      });
    }, earlyObserverOptions);

    const underline = document.querySelector('.underline-animate');
    if (underline) underlineObserver.observe(underline);

    return () => {
      earlySections.forEach(section => earlyObserver.unobserve(section));
      if (underline) underlineObserver.unobserve(underline);
    };
  }, []);

  const steps = [
    {
      step: '1',
      title: 'Answer a few questions',
      desc: <>Who does what, who owns what,<br />and what you each bring to the table.</>
    },
    {
      step: '2',
      title: 'Smooth things out',
      desc: <>We show you where you're not aligned<br />before it turns into "we need to talk."</>
    },
    {
      step: '3',
      title: 'Seal the deal',
      desc: <>Get a legit cofounder agreement.<br />No $600/hr lawyers, no 2 a.m. screaming.</>
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
      q: 'What\'s a cofounder agreement, and why do I need one?',
      a: 'It\'s basically a prenup for your startup. It spells out equity, roles, and expectations so you don\'t end up in a messy breakup later. Think of it as cheap insurance against expensive fights.'
    },
    {
      q: 'When\'s the right time to create a cofounder agreement?',
      a: 'As early as possible. Day 1 is ideal, but day 100 is still better than never. The earlier you do it, the easier (and less awkward) it is.'
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50">
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
                className="button-shimmer bg-[#000000] text-white px-5 py-2.5 rounded hover:bg-[#1a1a1a] transition"
              >
                Create agreement
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6" style={{ paddingTop: '154px', paddingBottom: '58px' }}>
        <div className="max-w-6xl mx-auto text-center">
          <div className="hero-content">
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
                or <a href="#" className="text-black underline hover:text-gray-900 font-semibold">Book a Free Consultation</a>
              </p>
            </div>
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

      {/* Process Section - Combined heading + cards */}
      <section className="scroll-section scroll-section-early process-section px-6" style={{ paddingTop: '144px', paddingBottom: '240px' }}>
        <div className="max-w-7xl mx-auto" style={{ minHeight: '180vh' }}>
          <div className="sticky top-[120px] mx-auto" style={{ maxWidth: '720px' }}>
            {/* Heading - now sticky with cards */}
            <div className="max-w-6xl mx-auto text-center mb-10">
              <h2 className="section-header font-heading text-[46px] font-medium mb-4">
                Built for <span className="underline-animate">early-stage
                  <svg viewBox="0 0 250 12" preserveAspectRatio="none">
                    <path d="M 3,10 Q 60,6 125,4 Q 190,3 245,3 Q 250,4 228,6" />
                  </svg>
                </span> cofounders<span style={{ marginLeft: '0.05em' }}>.</span>
              </h2>
              <p className="text-[16px] max-w-3xl mx-auto font-normal" style={{ color: '#716B6B' }}>
                Get your equity, expectations, and everything else right from the start.
              </p>
            </div>

            {/* Stacked Cards Container */}
            <div style={{ height: '900px', position: 'relative' }}>
              {steps.map((step, index) => {
                const bgColors = ['#fafafa', '#f0f0f0', '#e8e8e8'];
                return (
                  <div
                    key={index}
                    className="absolute left-0 right-0 rounded-2xl border-2 border-gray-300 p-20 transition-all duration-700 ease-out"
                    style={{
                      top: `${15 * index}px`,
                      transform: `translateY(${cardOffsets[index]}px)`,
                      zIndex: 3 - index,
                      opacity: 1,
                      backgroundColor: bgColors[index],
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                  <div className="text-center">
                    <div className="font-medium text-[20px] mb-4" style={{ color: '#666' }}>
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-[24px] font-medium mb-4 text-center" style={{ color: '#333333' }}>{step.title}</h3>
                      <p className="text-[15px] text-center" style={{ color: '#666', lineHeight: '1.3' }}>{step.desc}</p>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-section py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-header font-heading text-[46px] font-medium text-center mb-16">Turn your cofoundership<br />into a company, <em className="italic" style={{ display: 'inline-block', minWidth: '6ch', textAlign: 'left', letterSpacing: '-0.02em' }}>{typedToday || '\u00A0'}</em></h2>

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
      <section id="pricing" className="scroll-section py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-header font-heading text-[46px] font-medium text-center mb-4">Pricing<span style={{ marginLeft: '0.05em' }}>.</span></h2>
          <p className="text-center text-[16px] mb-16 font-normal" style={{ color: '#716B6B' }}>Choose the plan that's right for your team.</p>

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
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="scroll-section py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-80 items-start justify-center ml-32">
            <div className="flex-shrink-0">
              <h2 className="section-header font-heading text-[46px] font-medium">FAQs<span style={{ marginLeft: '0.05em' }}>.</span></h2>
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

      {/* Final CTA */}
      <section className="scroll-section-full py-24 px-6 bg-white text-gray-900">
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
              or <a href="#" className="text-black underline hover:text-gray-900 font-semibold">Book a Free Consultation</a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <style jsx>{`
        /* Disable fadeInDown/fadeInUp animations on landing page only */
        .scroll-section .text-3xl,
        .scroll-section .leading-relaxed,
        .scroll-section .space-y-6 > div,
        .scroll-section .space-y-8 > div,
        .scroll-section .space-y-10 > div,
        .scroll-section .space-y-12 > div,
        .scroll-section .animate-fade-up,
        .scroll-section .animate-fade-down,
        .scroll-section [class*="animate-fade"] {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }

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
