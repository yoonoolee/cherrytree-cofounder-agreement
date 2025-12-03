import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { usePageMeta } from '../hooks/usePageMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';

function LandingPage() {
  const navigate = useNavigate();

  // SEO meta tags for homepage
  usePageMeta({
    title: 'Cherrytree - Create Cofounder Agreements',
    description: 'Cherrytree makes it easy to create cofounder agreements and determine equity splits.'
  });
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [typedText, setTypedText] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [cardTilt, setCardTilt] = useState(15);
  const [activeFeature, setActiveFeature] = useState(0);
  const [contractCardsVisible, setContractCardsVisible] = useState(false);
  const [contractCardsFading, setContractCardsFading] = useState(false);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [equityChartVisible, setEquityChartVisible] = useState(false);
  const [equityChartFading, setEquityChartFading] = useState(false);
  const [equityAnimationCycle, setEquityAnimationCycle] = useState(0);
  const [expertGuidanceVisible, setExpertGuidanceVisible] = useState(false);
  const [expertGuidanceFading, setExpertGuidanceFading] = useState(false);
  const [expertGuidanceAnimationCycle, setExpertGuidanceAnimationCycle] = useState(0);
  const [featuresInView, setFeaturesInView] = useState(false);
  const featuresRef = useRef(null);
  const [typedAnd, setTypedAnd] = useState('');
  const [typedToday, setTypedToday] = useState('');
  const [videoOpacity, setVideoOpacity] = useState(0);
  const fullText = 'with great company.';
  const andText = 'and';
  const todayText = 'today.';

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

  // Intersection Observer for features section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFeaturesInView(true);
            setActiveFeature(0); // Reset to first tab when section comes into view
          } else {
            setFeaturesInView(false);
            setContractCardsVisible(false);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Contract Creator animation with 2 cycles then auto-advance
  useEffect(() => {
    if (activeFeature !== 0 || !featuresInView) {
      setContractCardsVisible(false);
      setContractCardsFading(false);
      setAnimationCycle(0);
      return;
    }

    // Start animation
    setContractCardsFading(false);
    setContractCardsVisible(false);
    const startTimer = setTimeout(() => {
      setContractCardsVisible(true);
    }, 50);

    // After animation completes (5.4s), start fade out
    const fadeTimer = setTimeout(() => {
      setContractCardsFading(true);
    }, 5500);

    // After slide out (0.8s), either restart or advance
    const cycleTimer = setTimeout(() => {
      if (animationCycle < 1) {
        // Restart for second cycle
        setAnimationCycle(prev => prev + 1);
      } else {
        // After 2 cycles, move to next tab
        setActiveFeature(1);
        setAnimationCycle(0);
      }
    }, 6300);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(fadeTimer);
      clearTimeout(cycleTimer);
    };
  }, [activeFeature, featuresInView, animationCycle]);

  // Equity Calculator animation with 2 cycles then auto-advance
  useEffect(() => {
    if (activeFeature !== 1 || !featuresInView) {
      setEquityChartVisible(false);
      setEquityChartFading(false);
      setEquityAnimationCycle(0);
      return;
    }

    // Start animation
    setEquityChartFading(false);
    setEquityChartVisible(false);
    const startTimer = setTimeout(() => {
      setEquityChartVisible(true);
    }, 50);

    // After animation completes (4s), start fade out
    const fadeTimer = setTimeout(() => {
      setEquityChartFading(true);
    }, 4000);

    // After fade out (0.8s), either restart or advance
    const cycleTimer = setTimeout(() => {
      if (equityAnimationCycle < 1) {
        // Restart for second cycle
        setEquityAnimationCycle(prev => prev + 1);
      } else {
        // After 2 cycles, move to next tab
        setActiveFeature(2);
        setEquityAnimationCycle(0);
      }
    }, 4800);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(fadeTimer);
      clearTimeout(cycleTimer);
    };
  }, [activeFeature, featuresInView, equityAnimationCycle]);

  // Expert Guidance animation with 2 cycles then auto-advance
  useEffect(() => {
    if (activeFeature !== 2 || !featuresInView) {
      setExpertGuidanceVisible(false);
      setExpertGuidanceFading(false);
      setExpertGuidanceAnimationCycle(0);
      return;
    }

    // Start animation
    setExpertGuidanceFading(false);
    setExpertGuidanceVisible(false);
    const startTimer = setTimeout(() => {
      setExpertGuidanceVisible(true);
    }, 50);

    // After animation completes (4s), start fade out
    const fadeTimer = setTimeout(() => {
      setExpertGuidanceFading(true);
    }, 4000);

    // After fade out (0.8s), either restart or advance
    const cycleTimer = setTimeout(() => {
      if (expertGuidanceAnimationCycle < 1) {
        // Restart for second cycle
        setExpertGuidanceAnimationCycle(prev => prev + 1);
      } else {
        // After 2 cycles, move to first tab
        setActiveFeature(0);
        setExpertGuidanceAnimationCycle(0);
      }
    }, 4800);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(fadeTimer);
      clearTimeout(cycleTimer);
    };
  }, [activeFeature, featuresInView, expertGuidanceAnimationCycle]);

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

  // Scroll-based card reveal
  const [revealedCards, setRevealedCards] = useState([false, false, false]);

  useEffect(() => {
    const handleScroll = () => {
      const cards = document.querySelectorAll('.process-card');
      const windowHeight = window.innerHeight;

      setRevealedCards(prev => {
        const newRevealed = [...prev];
        cards.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          // Reveal when card is 80% into viewport, hide when scrolled out
          if (rect.top < windowHeight * 0.8 && rect.bottom > 0) {
            newRevealed[index] = true;
          } else {
            newRevealed[index] = false;
          }
        });
        return newRevealed;
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Delay initial check to ensure cards are rendered
    setTimeout(handleScroll, 100);

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
      title: 'Invite your cofounders',
      desc: 'Add your cofounders as collaborators. They must be added to be included in the Cofounder Agreement.'
    },
    {
      step: '2',
      title: 'Collab on the agreement',
      desc: 'You and your cofounders answer a set of guided questions together. Nobody has to play "project manager" or relay answers.'
    },
    {
      step: '3',
      title: 'Do a final review',
      desc: 'We take your responses and turn them into a Cofounder Agreement, ready for your final review and signature.'
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
      description: 'Use our proprietary equity calculator to determine ownership. Instant, precise splits so everyone knows their stake.',
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
        'Attorney review',
        'Cofounder coaching',
        'Priority support'
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
    <div className="landing-page min-h-screen bg-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="px-4 md:px-6 pt-20 md:pt-32 lg:pt-40 pb-8 md:pb-14">
        <div className="max-w-6xl mx-auto text-center">
          <div className="hero-content">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-gray-900 mb-4 md:mb-6 min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
              Great companies start
              <br />
              <em className="italic">{typedText || '\u00A0'}</em>
            </h1>
            <p className="text-sm md:text-base mb-8 md:mb-16 max-w-2xl mx-auto font-normal px-4" style={{ color: '#716B6B' }}>
              Answer guided questions with your cofounders and get a complete<br className="hidden sm:block" /> Cofounder Agreement. No sketchy templates, no overpriced lawyers.
            </p>
            <div className="flex flex-col items-center gap-3 mb-8 md:mb-12">
              <button
                onClick={() => {
                  // Navigate directly to my.cherrytree.app to avoid double redirect
                  const isProduction = window.location.hostname.includes('cherrytree.app');
                  if (isProduction) {
                    window.location.href = 'https://my.cherrytree.app/dashboard';
                  } else {
                    navigate('/dashboard', { replace: true });
                  }
                }}
                className="button-shimmer bg-[#000000] text-white px-8 md:px-16 py-3 md:py-4 rounded-md text-sm md:text-base font-normal hover:bg-[#1a1a1a] transition"
              >
                Create agreement
              </button>
              <p className="text-xs md:text-sm text-gray-600">
                or <a href="#" className="text-black underline hover:text-gray-900 font-semibold">Book a Free Consultation</a>
              </p>
            </div>
          </div>

          {/* Logo Carousel */}
          <div className="logo-scroller">
            <div className="logo-track">
              <div className="logo-box"><img src="/images/yc-logo.png" alt="Y Combinator" /></div>
              <div className="logo-box"><img src="/images/hubble-logo.png" alt="Hubble" style={{ transform: 'scale(1.1)' }} /></div>
              <div className="logo-box"><img src="/images/a16z-logo.jpg" alt="a16z" style={{ transform: 'scale(1.1)' }} /></div>
              <div className="logo-box"><img src="/images/berkeley-logo.png" alt="Berkeley" style={{ transform: 'scale(1.43)' }} /></div>
              <div className="logo-box"><img src="/images/stanford-logo.png" alt="Stanford" /></div>
              <div className="logo-box"><img src="/images/sequoia-logo.png" alt="Sequoia" style={{ transform: 'scale(0.9)' }} /></div>
              <div className="logo-box"><img src="/images/startupgrind-logo.png" alt="Startup Grind" /></div>

              {/* duplicate logos for seamless scroll */}
              <div className="logo-box"><img src="/images/yc-logo.png" alt="Y Combinator" /></div>
              <div className="logo-box"><img src="/images/hubble-logo.png" alt="Hubble" style={{ transform: 'scale(1.1)' }} /></div>
              <div className="logo-box"><img src="/images/a16z-logo.jpg" alt="a16z" style={{ transform: 'scale(1.1)' }} /></div>
              <div className="logo-box"><img src="/images/berkeley-logo.png" alt="Berkeley" style={{ transform: 'scale(1.43)' }} /></div>
              <div className="logo-box"><img src="/images/stanford-logo.png" alt="Stanford" /></div>
              <div className="logo-box"><img src="/images/sequoia-logo.png" alt="Sequoia" style={{ transform: 'scale(0.9)' }} /></div>
              <div className="logo-box"><img src="/images/startupgrind-logo.png" alt="Startup Grind" /></div>
            </div>
          </div>

          {/* Tilted Card */}
          <div className="mt-2 md:mt-4" style={{ perspective: '1000px' }}>
            <div
              className="tilty-card mx-auto"
              style={{
                width: '100%',
                maxWidth: 'min(1100px, 90vw)',
                height: 'auto',
                aspectRatio: '1100 / 595',
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px md:rounded-xl',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                transform: `rotateX(${cardTilt}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s ease-out',
                padding: '0',
                overflow: 'hidden'
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="tilty-video"
                ref={(video) => {
                  if (video) video.playbackRate = 1.2;
                }}
                onTimeUpdate={(e) => {
                  const video = e.target;
                  const duration = video.duration;
                  const currentTime = video.currentTime;
                  const fadeTime = 0.8; // seconds for fade

                  if (currentTime < fadeTime) {
                    // Fade in at start - use ease-in curve
                    const progress = currentTime / fadeTime;
                    setVideoOpacity(progress * progress);
                  } else if (currentTime > duration - fadeTime) {
                    // Fade out at end - use ease-out curve
                    const progress = (duration - currentTime) / fadeTime;
                    setVideoOpacity(progress * progress);
                  } else {
                    setVideoOpacity(1);
                  }
                }}
                onLoadedData={() => setVideoOpacity(0)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  borderRadius: '12px',
                  background: '#ffffff',
                  display: 'block',
                  opacity: videoOpacity,
                  transition: 'opacity 0.15s ease-out'
                }}
              >
                <source src="/images/Cherrytree - Cofounder Agreements for Early-Stage Teams 11-21-2025 20-27-31.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - Combined heading + cards */}
      <section className="scroll-section scroll-section-early process-section px-4 md:px-6 pt-20 md:pt-32 lg:pt-36 pb-16 md:pb-24 lg:pb-30">
        <div className="max-w-7xl mx-auto">
          <div className="mx-auto" style={{ maxWidth: '720px' }}>
            {/* Heading */}
            <div className="max-w-6xl mx-auto text-center mb-8 md:mb-10">
              <h2 className="section-header font-heading text-3xl sm:text-4xl md:text-5xl font-medium mb-3 md:mb-4">
                Built for <span className="underline-animate">early-stage
                  <svg viewBox="0 0 250 12" preserveAspectRatio="none">
                    <path d="M 3,10 Q 60,6 125,4 Q 190,3 245,3 Q 250,4 228,6" />
                  </svg>
                </span> cofounders<span style={{ marginLeft: '0.05em' }}>.</span>
              </h2>
              <p className="text-sm md:text-base max-w-3xl mx-auto font-normal px-4" style={{ color: '#716B6B' }}>
                Get your equity, expectations, and everything else right from the start.
              </p>
            </div>

            {/* Cards - Simple vertical stack */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const cardStyle = {
                  background: '#fcfcfc',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                };
                return (
                  <div
                    key={index}
                    className={`process-card rounded-lg p-6 md:p-12 py-10 md:py-20 ${
                      revealedCards[index]
                        ? 'card-bounce-in'
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={{
                      background: cardStyle.background,
                      border: cardStyle.border,
                      boxShadow: cardStyle.boxShadow
                    }}
                  >
                  <div className="flex flex-col-reverse md:flex-row items-center gap-6 md:gap-8">
                    {/* Animation area */}
                    <div className="relative rounded-lg flex-shrink-0 w-full md:w-[280px]" style={{ height: '160px' }}>
                      {index === 0 && (
                        /* Step 1: Invite animation */
                        <div className="p-4 h-full flex flex-col justify-center">
                          <div className="flex gap-2 mb-3">
                            <div className="step1-input h-8 bg-white border border-gray-200 rounded px-2 flex items-center" style={{ minWidth: '160px', flex: '1 1 160px' }}>
                              <span className="step1-email text-sm text-gray-400" style={{ minWidth: '140px' }}></span>
                            </div>
                            <div className="step1-btn h-8 px-3 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs rounded flex items-center transition-colors whitespace-nowrap">Add</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-500">you@email.com</div>
                            <div className="step1-user2 text-sm text-gray-500 opacity-0">cofounder@email.com</div>
                          </div>
                        </div>
                      )}
                      {index === 1 && (
                        /* Step 2: Collab animation */
                        <div className="p-4 h-full relative flex flex-col justify-center">
                          <div className="step2-cursor-black absolute w-3 h-3 z-20">
                            <svg viewBox="0 0 24 24" fill="black" className="w-3 h-3">
                              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.72a.5.5 0 0 0-.44.49Z"/>
                            </svg>
                          </div>
                          <div className="step2-cursor-white absolute w-3 h-3 z-20">
                            <svg viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" className="w-3 h-3">
                              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.72a.5.5 0 0 0-.44.49Z"/>
                            </svg>
                          </div>
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Company Name</p>
                            <div className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm h-7">
                              <span className="step2-typing text-gray-700"></span>
                              <span className="step2-caret"></span>
                            </div>
                          </div>
                          <div className="relative">
                            <p className="text-xs text-gray-500 mb-1">Industry</p>
                            <div className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm h-7 flex items-center justify-between">
                              <span className="step2-industry text-gray-400"></span>
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <div className="step2-dropdown absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
                              <div className="step2-option px-2 py-1.5 text-xs text-gray-700">AI / ML</div>
                              <div className="px-2 py-1.5 text-xs text-gray-700">Fintech</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {index === 2 && (
                        /* Step 3: Review animation - document scanner */
                        <div className="p-4 h-full flex items-center justify-center relative">
                          <div className="bg-white rounded border border-gray-200 p-3 w-full h-full relative">
                            <p className="text-xs text-gray-500 mb-2">Cofounder Agreement</p>
                            <div className="space-y-1.5">
                              {/* Paragraph 1 */}
                              <div className="h-1 bg-gray-200 rounded w-full"></div>
                              <div className="h-1 bg-gray-200 rounded w-11/12"></div>
                              <div className="h-1 bg-gray-200 rounded w-3/4"></div>

                              {/* Paragraph 2 */}
                              <div className="h-1 bg-gray-200 rounded w-full mt-3"></div>
                              <div className="h-1 bg-gray-200 rounded w-4/5"></div>
                              <div className="h-1 bg-gray-200 rounded w-full"></div>

                              {/* Paragraph 3 */}
                              <div className="h-1 bg-gray-200 rounded w-5/6 mt-3"></div>
                              <div className="h-1 bg-gray-200 rounded w-full"></div>
                            </div>
                            {/* Scanner line */}
                            <div className="step3-scanner absolute left-2 right-2 h-0.5 bg-gray-300" style={{ boxShadow: '0 0 6px 1px rgba(209, 213, 219, 0.5)' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Text content */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="font-medium text-base md:text-lg mb-2" style={{ color: '#666' }}>
                        Step {step.step}
                      </div>
                      <h3 className="text-xl md:text-[22px] font-medium mb-2" style={{ color: '#333333' }}>{step.title}</h3>
                      <p className="text-sm md:text-[14px]" style={{ color: '#666', lineHeight: '1.4' }}>{step.desc}</p>
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
      <section id="features" ref={featuresRef} className="scroll-section py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-header font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-center mb-10 md:mb-16 px-2">Turn your cofoundership<br className="hidden sm:block" />into a company, <em className="italic" style={{ display: 'inline-block', minWidth: '6ch', textAlign: 'left', letterSpacing: '-0.02em' }}>{typedToday || '\u00A0'}</em></h2>

          <div className="features-container">
            <div className="features-left">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`feature-card ${activeFeature === i ? 'active' : ''}`}
                  onClick={() => { setActiveFeature(i); setAnimationCycle(0); }}
                >
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className={`feature-description ${activeFeature === i ? 'active' : ''}`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="feature-visual">
              {/* Contract Creator - 4 Cards + Document */}
              <div
                className={`visual-content contract-animation-container ${activeFeature === 0 ? 'active' : ''} ${contractCardsFading ? 'contract-animation-fading' : ''}`}
                id="contract-creator"
                style={{
                  opacity: activeFeature === 0 ? 1 : 0,
                  pointerEvents: activeFeature === 0 ? 'auto' : 'none',
                  flexDirection: 'row',
                  gap: '20px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0 40px'
                }}
              >
                {/* Left column - 4 cards */}
                <div className={contractCardsFading ? 'slide-out-left' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { title: 'Cofounders', content: 'Steve Jobs\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Steve Woz\nRon Wayne' },
                    { title: 'Equity', content: '45% - 45% - 10%' },
                    { title: 'Vesting', content: '4 years with a 1 year cliff' },
                    { title: 'And more', content: '' }
                  ].map((card, i) => (
                    <div
                      key={i}
                      className={contractCardsVisible ? 'card-visible' : 'card-hidden'}
                      style={{
                        width: '200px',
                        height: '100px',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        '--delay': `${0.5 + i * 0.3}s`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        padding: '16px'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#7c8590' }}>{card.title}</span>
                      {card.content && (
                        <span style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px', whiteSpace: 'pre-line' }}>{card.content}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Curly brace connecting cards to document */}
                <svg
                  className={`${contractCardsVisible ? 'card-visible' : 'card-hidden'} ${contractCardsFading ? 'slide-out-left' : ''}`}
                  style={{
                    width: '40px',
                    height: '436px',
                    '--delay': '1.7s',
                    transformOrigin: 'center'
                  }}
                  viewBox="0 0 40 436"
                  fill="none"
                >
                  <path
                    d="M 0 0 Q 20 0, 20 109 Q 20 218, 40 218 Q 20 218, 20 327 Q 20 436, 0 436"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>

                {/* Right column - Document card */}
                <div
                  className={`${contractCardsVisible ? 'card-visible' : 'card-hidden'} ${contractCardsFading ? 'slide-out-right' : ''}`}
                  style={{
                    width: '360px',
                    height: '436px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    '--delay': '2.0s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '24px'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#7c8590', marginBottom: '20px' }}>Cofounder Agreement</span>

                  {/* Animated text lines */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 8px' }}>
                    {[
                      { width: '100%', delay: 2.3, paragraphStart: false },
                      { width: '100%', delay: 2.45, paragraphStart: false },
                      { width: '100%', delay: 2.6, paragraphStart: false },
                      { width: '50%', delay: 2.75, paragraphStart: false },
                      { width: '100%', delay: 2.9, paragraphStart: true },
                      { width: '100%', delay: 3.05, paragraphStart: false },
                      { width: '100%', delay: 3.2, paragraphStart: false },
                      { width: '65%', delay: 3.35, paragraphStart: false },
                      { width: '100%', delay: 3.5, paragraphStart: true },
                      { width: '100%', delay: 3.65, paragraphStart: false },
                      { width: '100%', delay: 3.8, paragraphStart: false },
                      { width: '40%', delay: 3.95, paragraphStart: false },
                    ].map((line, i) => (
                      <div
                        key={i}
                        className={`text-line ${contractCardsVisible ? 'text-line-visible' : ''}`}
                        style={{
                          width: line.width,
                          '--line-delay': `${line.delay}s`,
                          marginTop: line.paragraphStart ? '12px' : '0'
                        }}
                      />
                    ))}
                  </div>

                  {/* Signature */}
                  <div style={{ width: '100%', marginTop: 'auto', padding: '0 8px' }}>
                    <svg
                      style={{
                        width: '140px',
                        height: '50px',
                        '--sig-delay': '4.2s'
                      }}
                      viewBox="0 0 140 50"
                      fill="none"
                    >
                      <path
                        className={`signature-path ${contractCardsVisible ? 'signature-draw' : ''}`}
                        d="M 5 35 C 10 20, 15 15, 20 25 C 25 35, 30 40, 35 30 C 40 20, 42 15, 48 20 C 54 25, 56 35, 62 28 C 68 21, 70 18, 78 22 C 86 26, 88 32, 95 25 C 102 18, 105 15, 112 20 C 119 25, 122 30, 130 22 L 135 18"
                        stroke="#9ca3af"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div style={{ width: '140px', height: '1px', backgroundColor: '#e5e7eb', marginTop: '2px' }} />
                  </div>
                </div>
              </div>

              {/* Equity Calculator */}
              <div
                className={`visual-content ${activeFeature === 1 ? 'active' : ''}`}
                id="equity-calculator"
                style={{
                  opacity: activeFeature === 1 ? 1 : 0,
                  transform: activeFeature === 1 ? 'scale(1)' : 'scale(0.95)',
                  pointerEvents: activeFeature === 1 ? 'auto' : 'none',
                  flexDirection: 'row',
                  gap: '32px',
                  padding: '24px'
                }}
              >
                <div className={equityChartFading ? 'fade-out' : ''} style={{ display: 'flex', flexDirection: 'row', gap: '32px' }}>
                {/* Score Table */}
                <div className={`equity-table ${equityChartVisible ? 'equity-table-visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {/* Header row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 50px 50px 50px',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#f7f7f7',
                      borderRadius: '6px 6px 0 0'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#666' }}>Category</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', textAlign: 'center' }}>SJ</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', textAlign: 'center' }}>SW</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', textAlign: 'center' }}>RW</span>
                  </div>
                  {/* Data rows */}
                  {[
                    { category: 'Cash Invested', scores: [6, 6, 4], delays: [0.2, 0.35, 0.1] },
                    { category: 'Time Commit', scores: [10, 8, 4], delays: [0.4, 0.25, 0.5] },
                    { category: 'Leadership', scores: [8, 10, 2], delays: [0.55, 0.7, 0.45] },
                    { category: 'Engineering', scores: [4, 8, 4], delays: [0.65, 0.8, 0.6] },
                    { category: 'Sales', scores: [8, 4, 2], delays: [0.75, 0.9, 0.85] },
                    { category: 'Domain', scores: [6, 8, 6], delays: [1.0, 0.95, 1.1] },
                    { category: 'Network', scores: [8, 6, 4], delays: [1.15, 1.25, 1.05] },
                    { category: 'Idea Origin', scores: [10, 10, 4], delays: [1.3, 1.2, 1.35] }
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 50px 50px 50px',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa',
                        borderLeft: '1px solid #e5e7eb',
                        borderRight: '1px solid #e5e7eb',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#666' }}>{row.category}</span>
                      {row.scores.map((score, j) => (
                        <span
                          key={j}
                          className={`equity-number ${equityChartVisible ? 'equity-fade-in' : ''}`}
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#999',
                            textAlign: 'center',
                            '--fade-delay': `${row.delays[j] + 0.3}s`
                          }}
                        >
                          {score}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Pie Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                    <svg
                      viewBox="0 0 100 100"
                      style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
                    >
                      {/* Border circles for each segment */}
                      <circle
                        className={`pie-segment ${equityChartVisible ? 'pie-segment-animate' : ''}`}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#cccccc"
                        strokeWidth="13"
                        strokeDasharray="98.96 120.95"
                        strokeDashoffset="0"
                        style={{ '--segment-delay': '1.62s', '--segment-length': '98.96' }}
                      />
                      <circle
                        className={`pie-segment ${equityChartVisible ? 'pie-segment-animate' : ''}`}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#cccccc"
                        strokeWidth="13"
                        strokeDasharray="98.96 120.95"
                        strokeDashoffset="-98.96"
                        style={{ '--segment-delay': '1.89s', '--segment-length': '98.96' }}
                      />
                      <circle
                        className={`pie-segment ${equityChartVisible ? 'pie-segment-animate' : ''}`}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#cccccc"
                        strokeWidth="13"
                        strokeDasharray="21.99 197.92"
                        strokeDashoffset="-197.92"
                        style={{ '--segment-delay': '2.16s', '--segment-length': '21.99' }}
                      />
                      {/* Segment 1 - 45% (Steve) */}
                      <circle
                        className={`pie-segment ${equityChartVisible ? 'pie-segment-animate' : ''}`}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#d0d0d0"
                        strokeWidth="12"
                        strokeDasharray="98.96 120.95"
                        strokeDashoffset="0"
                        style={{ '--segment-delay': '1.62s', '--segment-length': '98.96' }}
                      />
                      {/* Segment 2 - 45% (Woz) */}
                      <circle
                        className={`pie-segment ${equityChartVisible ? 'pie-segment-animate' : ''}`}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#f0f0f0"
                        strokeWidth="12"
                        strokeDasharray="98.96 120.95"
                        strokeDashoffset="-98.96"
                        style={{ '--segment-delay': '1.89s', '--segment-length': '98.96' }}
                      />
                      {/* Segment 3 - 10% (Ron) */}
                      <circle
                        className={`pie-segment ${equityChartVisible ? 'pie-segment-animate' : ''}`}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="12"
                        strokeDasharray="21.99 197.92"
                        strokeDashoffset="-197.92"
                        style={{ '--segment-delay': '2.16s', '--segment-length': '21.99' }}
                      />
                    </svg>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { name: 'Steve J.', percent: '45%', color: '#d0d0d0', border: false, delay: '2.43s' },
                      { name: 'Steve W.', percent: '45%', color: '#f0f0f0', border: false, delay: '2.52s' },
                      { name: 'Ron W.', percent: '10%', color: '#ffffff', border: true, delay: '2.61s' }
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`equity-legend-item ${equityChartVisible ? 'equity-fade-in' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          '--fade-delay': item.delay
                        }}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, border: item.border ? '1px solid #ccc' : 'none' }} />
                        <span style={{ fontSize: '11px', color: '#666' }}>{item.name}</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>{item.percent}</span>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>

              {/* Expert Guidance */}
              <div
                className={`visual-content ${activeFeature === 2 ? 'active' : ''} ${expertGuidanceFading ? 'fade-out' : ''}`}
                id="expert-guidance"
                style={{
                  opacity: activeFeature === 2 ? 1 : 0,
                  transform: activeFeature === 2 ? 'scale(1)' : 'scale(0.95)',
                  pointerEvents: activeFeature === 2 ? 'auto' : 'none',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'stretch',
                  padding: '80px 40px 40px 40px',
                  gap: '32px'
                }}
              >
                {/* Contact icons - top center */}
                <div
                  className={`contact-icons ${expertGuidanceVisible ? 'contact-icons-visible' : ''}`}
                  style={{
                    position: 'absolute',
                    top: '50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  {/* Email icon */}
                  <div
                    className={`contact-icon ${expertGuidanceVisible ? 'contact-icon-visible' : ''}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      '--icon-delay': '0s'
                    }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c8590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M22 7l-10 7L2 7"/>
                    </svg>
                  </div>
                  {/* Text/Message icon */}
                  <div
                    className={`contact-icon ${expertGuidanceVisible ? 'contact-icon-visible' : ''}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      '--icon-delay': '0.15s'
                    }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c8590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  {/* Call icon */}
                  <div
                    className={`contact-icon ${expertGuidanceVisible ? 'contact-icon-visible' : ''}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      '--icon-delay': '0.3s'
                    }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c8590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                </div>

                {/* Question bubble - from right */}
                <div
                  className={`speech-box-right ${expertGuidanceVisible ? 'speech-box-right-visible' : ''}`}
                  style={{
                    width: '400px',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '24px',
                    position: 'relative',
                    alignSelf: 'flex-end'
                  }}
                >
                  {/* Speech bubble tail - right side */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '-10px',
                      top: '24px',
                      width: '0',
                      height: '0',
                      borderTop: '10px solid transparent',
                      borderBottom: '10px solid transparent',
                      borderLeft: '10px solid #ffffff',
                      filter: 'drop-shadow(2px 0 1px rgba(0, 0, 0, 0.05))'
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#7c8590', marginBottom: '12px', display: 'block' }}>Your Question</span>

                  {/* Animated text lines */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { width: '100%', delay: 0.3 },
                      { width: '100%', delay: 0.45 },
                      { width: '60%', delay: 0.6 }
                    ].map((line, i) => (
                      <div
                        key={i}
                        className={`text-line ${expertGuidanceVisible ? 'text-line-visible' : ''}`}
                        style={{
                          width: line.width,
                          '--line-delay': `${line.delay}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Expert response bubble - from left */}
                <div
                  className={`speech-box ${expertGuidanceVisible ? 'speech-box-visible' : ''}`}
                  style={{
                    width: '400px',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '24px',
                    position: 'relative',
                    alignSelf: 'flex-start'
                  }}
                >
                  {/* Speech bubble tail - left side */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-10px',
                      top: '24px',
                      width: '0',
                      height: '0',
                      borderTop: '10px solid transparent',
                      borderBottom: '10px solid transparent',
                      borderRight: '10px solid #ffffff',
                      filter: 'drop-shadow(-2px 0 1px rgba(0, 0, 0, 0.05))'
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#7c8590', marginBottom: '12px', display: 'block' }}>Expert Answer</span>

                  {/* Animated text lines */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { width: '100%', delay: 1.2 },
                      { width: '100%', delay: 1.35 },
                      { width: '100%', delay: 1.5 },
                      { width: '45%', delay: 1.65 }
                    ].map((line, i) => (
                      <div
                        key={i}
                        className={`text-line ${expertGuidanceVisible ? 'text-line-visible' : ''}`}
                        style={{
                          width: line.width,
                          '--line-delay': `${line.delay}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="scroll-section py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-header font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-center mb-3 md:mb-4">Pricing<span style={{ marginLeft: '0.05em' }}>.</span></h2>
          <p className="text-center text-sm md:text-base mb-12 md:mb-16 font-normal px-4" style={{ color: '#716B6B' }}>
            Choose the plan that's right for your team.{' '}
            <a href="/pricing" className="underline hover:text-black transition-colors" style={{ color: '#9CA3AF' }}>
              Compare plans.
            </a>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 items-stretch max-w-7xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`bg-white p-6 md:p-8 rounded-lg flex flex-col ${
                  plan.featured
                    ? 'ring-2 ring-gray-700'
                    : 'border border-gray-400'
                }`}
              >
                <h3 className="text-lg md:text-xl font-normal mb-2 text-[#716B6B]">{plan.name}</h3>
                <div className="text-3xl md:text-4xl font-bold mb-2">{plan.price}</div>
                <p className="text-sm md:text-base text-gray-600 mb-6">{plan.description}</p>
                <button
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 });
                    } else {
                      // Navigate directly to my.cherrytree.app to avoid double redirect
                      const isProduction = window.location.hostname.includes('cherrytree.app');
                      if (isProduction) {
                        window.location.href = 'https://my.cherrytree.app/dashboard';
                      } else {
                        navigate('/dashboard', { replace: true });
                      }
                    }
                  }}
                  className={`w-full py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold transition mb-6 ${
                    plan.featured
                      ? 'button-shimmer bg-[#000000] text-white hover:bg-[#1a1a1a]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact sales' : 'Get started'}
                </button>
                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm md:text-base">
                      <span className="text-[#716B6B]">✓</span>
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
      <section id="faq" className="scroll-section py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 md:gap-20 lg:gap-80 items-start md:justify-center md:ml-32">
            <div className="flex-shrink-0 w-full md:w-auto text-center md:text-left">
              <h2 className="section-header font-heading text-3xl sm:text-4xl md:text-5xl font-medium">FAQs<span style={{ marginLeft: '0.05em' }}>.</span></h2>
            </div>
            <div className="flex-1 max-w-[700px] w-full">
              {faqs.map((faq, i) => (
                <div key={i} className="accordion-item border-b border-gray-300">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="accordion-title w-full py-4 md:py-5 px-3 md:px-4 flex justify-between items-center transition hover:bg-gray-50 text-left"
                  >
                    <span className="font-medium text-black text-sm md:text-base pr-4">{faq.q}</span>
                    <span className={`accordion-icon text-gray-400 font-light transition-all duration-300 flex-shrink-0 text-xl ${openFaq === i ? 'rotate-90 scale-110 text-gray-700' : ''}`}>
                      +
                    </span>
                  </button>
                  <div
                    className={`accordion-content overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-[1000px] py-6 md:py-8 px-3 md:px-4' : 'max-h-0 py-0 px-3 md:px-4'}`}
                  >
                    <p className="text-gray-600 text-sm md:text-[0.95rem]">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="scroll-section-full py-16 md:py-24 px-4 md:px-6 bg-white text-gray-900">
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
        <div className="max-w-4xl mx-auto text-center mt-12 md:mt-16">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => {
                // Navigate directly to my.cherrytree.app to avoid double redirect
                const isProduction = window.location.hostname.includes('cherrytree.app');
                if (isProduction) {
                  window.location.href = 'https://my.cherrytree.app/dashboard';
                } else {
                  navigate('/dashboard', { replace: true });
                }
              }}
              className="button-shimmer bg-[#000000] text-white px-8 md:px-16 py-3 md:py-4 rounded-md text-sm md:text-base font-normal hover:bg-[#1a1a1a] transition"
            >
              Create agreement
            </button>
            <p className="text-xs md:text-sm text-gray-600">
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

          /* Reduce tilt effect on mobile */
          .tilty-card {
            transform: rotateX(0deg) !important;
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
          background: #fefefe;
          border-radius: 8px;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
          overflow: hidden;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 16px 32px;
          border: 12px solid #f7f7f7;
          height: calc(160px*3 + 24px);
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

        .card-hidden {
          opacity: 0;
          transform: scale(0.8);
        }

        .card-visible {
          opacity: 1;
          transform: scale(1);
          transition: opacity 0.25s ease-out var(--delay), transform 0.25s ease-out var(--delay);
        }

        .slide-out-left {
          transform: translateX(-400px) !important;
          transition: transform 0.8s ease-in-out !important;
        }

        .slide-out-right {
          transform: translateX(500px) !important;
          transition: transform 0.8s ease-in-out !important;
        }

        .slide-out-up {
          transform: translateY(-500px) !important;
          transition: transform 0.8s ease-in-out !important;
        }

        .fade-out {
          opacity: 0 !important;
          transition: opacity 0.8s ease-in-out !important;
        }

        .text-line {
          height: 6px;
          background-color: #e5e7eb;
          border-radius: 3px;
          transform-origin: left;
          transform: scaleX(0);
        }

        .text-line-visible {
          animation: drawLine 0.4s ease-out forwards;
          animation-delay: var(--line-delay);
        }

        @keyframes drawLine {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        .signature-path {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
        }

        .signature-draw {
          animation: drawSignature 1.2s ease-out forwards;
          animation-delay: var(--sig-delay);
        }

        @keyframes drawSignature {
          to {
            stroke-dashoffset: 0;
          }
        }

        .arrow-hidden {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
        }

        .arrow-draw {
          stroke-dasharray: 300;
          stroke-dashoffset: 0;
          transition: stroke-dashoffset 0.5s ease-out var(--arrow-delay);
        }

        /* Speech box fade animations */
        .speech-box {
          opacity: 0;
          transition: opacity 0.5s ease-out 1.1s;
        }

        .speech-box-visible {
          opacity: 1;
        }

        .speech-box-right {
          opacity: 0;
          transition: opacity 0.5s ease-out;
        }

        .speech-box-right-visible {
          opacity: 1;
        }

        .contact-icon {
          opacity: 0;
          transform: scale(0) translateY(-10px);
          transition: opacity 0.5s ease-out;
        }

        .contact-icon-visible {
          animation: iconBounce 0.5s ease-out forwards;
          animation-delay: var(--icon-delay);
        }

        .contact-icon-visible.fade-out-icon {
          opacity: 0;
          transform: scale(1) translateY(0);
          animation: none;
        }

        @keyframes iconBounce {
          0% {
            opacity: 0;
            transform: scale(0) translateY(-10px);
          }
          60% {
            opacity: 1;
            transform: scale(1.15) translateY(0);
          }
          80% {
            transform: scale(0.95) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        #expert-guidance.fade-out .speech-box,
        #expert-guidance.fade-out .speech-box-right {
          opacity: 0;
          transition: opacity 0.5s ease-out;
        }

        #expert-guidance.fade-out .contact-icon {
          animation: iconFadeOut 0.5s ease-out forwards;
        }

        @keyframes iconFadeOut {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(1) translateY(0);
          }
        }

        /* Equity Calculator Pie Chart Animations */
        .pie-border {
          opacity: 0;
        }

        .pie-border-animate {
          animation: equityFadeIn 0.3s ease-out forwards;
          animation-delay: 1.7s;
        }

        .pie-segment {
          stroke-dasharray: 0 219.91;
          transition: stroke-dasharray 0.8s ease-out;
        }

        .pie-segment-animate {
          animation: drawSegment 0.8s ease-out forwards;
          animation-delay: var(--segment-delay);
        }

        @keyframes drawSegment {
          from {
            stroke-dasharray: 0 219.91;
          }
          to {
            stroke-dasharray: var(--segment-length) 219.91;
          }
        }

        .equity-center-text,
        .equity-legend-item,
        .equity-number {
          opacity: 0;
        }

        .equity-table {
          opacity: 0;
        }

        .equity-table-visible {
          animation: equityTableFadeIn 1.2s ease-in-out forwards;
        }

        @keyframes equityTableFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .equity-fade-in {
          animation: equityFadeIn 0.15s ease-out forwards;
          animation-delay: var(--fade-delay);
        }

        @keyframes equityFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 968px) {
          .features-container {
            flex-direction: column;
          }
          .feature-visual {
            min-height: auto;
            height: auto;
            min-height: 320px;
            padding: 8px;
            border: 6px solid #f7f7f7;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .feature-card {
            padding: 20px;
            min-height: 120px;
          }
          .feature-title {
            font-size: 20px;
            margin-bottom: 12px;
          }
          .feature-description {
            font-size: 14px;
          }
          /* Scale down animations for mobile */
          .contract-animation-container,
          .visual-content {
            transform: scale(0.45);
            padding: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            transform-origin: center center;
          }
          #equity-calculator {
            transform: scale(0.4) !important;
            transform-origin: center center;
          }
          #expert-guidance {
            transform: scale(0.4) !important;
            transform-origin: center center;
          }
          /* Add more spacing for expert guidance icons on mobile */
          #expert-guidance .contact-icons {
            top: 5px !important;
          }
          #expert-guidance {
            padding-top: 35px !important;
            padding-bottom: 20px !important;
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
