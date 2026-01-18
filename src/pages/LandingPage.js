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
  const [section1Visible, setSection1Visible] = useState(false);
  const [section1Fading, setSection1Fading] = useState(false);
  const [section1AnimationCycle, setSection1AnimationCycle] = useState(0);
  const [typedCompanyName, setTypedCompanyName] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [typedEntity, setTypedEntity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [typedDate, setTypedDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [pricingCardAnimated, setPricingCardAnimated] = useState(false);
  const pricingCardRef = useRef(null);
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
  const andTimeoutsRef = useRef([]);
  useEffect(() => {
    // Clear any existing timeouts
    andTimeoutsRef.current.forEach(id => clearTimeout(id));
    andTimeoutsRef.current = [];

    let isMounted = true;

    const addTimeout = (fn, delay) => {
      const id = setTimeout(fn, delay);
      andTimeoutsRef.current.push(id);
      return id;
    };

    const typeLoop = () => {
      let index = 0;
      const type = () => {
        if (!isMounted) return;
        if (index < andText.length) {
          index++;
          setTypedAnd(andText.slice(0, index));
          addTimeout(type, 200);
        } else {
          addTimeout(() => {
            if (!isMounted) return;
            setTypedAnd('');
            addTimeout(typeLoop, 200);
          }, 1750);
        }
      };
      type();
    };

    addTimeout(typeLoop, 50);
    return () => {
      isMounted = false;
      andTimeoutsRef.current.forEach(id => clearTimeout(id));
      andTimeoutsRef.current = [];
    };
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

  // Pricing card animation - triggers every time on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!pricingCardRef.current) return;
      const rect = pricingCardRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Show when card is 80% into viewport, hide when scrolled out
      if (rect.top < windowHeight * 0.8 && rect.bottom > 0) {
        setPricingCardAnimated(true);
      } else {
        setPricingCardAnimated(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

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

  // Section1 animation with typing and selection
  useEffect(() => {
    // Reset animation
    setSection1Fading(false);
    setSection1Visible(false);
    setTypedCompanyName('');
    setShowCursor(false);
    setSelectedEntity('');
    setTypedEntity('');
    setSelectedDate('');
    setTypedDate('');
    setShowCalendar(false);

    const timers = [];

    // Show form
    timers.push(setTimeout(() => setSection1Visible(true), 100));

    // Show cursor in company name field
    timers.push(setTimeout(() => setShowCursor(true), 800));

    // Type company name
    const companyName = 'Cherrytree';
    companyName.split('').forEach((char, index) => {
      timers.push(setTimeout(() => {
        setTypedCompanyName(prev => prev + char);
      }, 1200 + index * 100));
    });

    // Hide cursor after typing
    timers.push(setTimeout(() => setShowCursor(false), 1200 + companyName.length * 100 + 300));

    // Select C-Corp after typing finishes (increased delay)
    timers.push(setTimeout(() => setSelectedEntity('C-Corp'), 1200 + companyName.length * 100 + 1500));

    // Type C-Corp in the agreement
    const entity = 'C-Corp';
    const entityStartTime = 1200 + companyName.length * 100 + 1550;
    entity.split('').forEach((char, index) => {
      timers.push(setTimeout(() => {
        setTypedEntity(prev => prev + char);
      }, entityStartTime + index * 60));
    });

    // Show calendar (increased delay)
    timers.push(setTimeout(() => setShowCalendar(true), 1200 + companyName.length * 100 + 3200));

    // Select date after calendar appears (increased delay)
    const dateText = 'January 8, 2025';
    timers.push(setTimeout(() => setSelectedDate(dateText), 1200 + companyName.length * 100 + 5000));

    // Type date in the agreement
    const dateStartTime = 1200 + companyName.length * 100 + 5050;
    dateText.split('').forEach((char, index) => {
      timers.push(setTimeout(() => {
        setTypedDate(prev => prev + char);
      }, dateStartTime + index * 60));
    });

    // Fade out (adjusted for longer animation)
    timers.push(setTimeout(() => setSection1Fading(true), 10000));

    // Restart cycle (adjusted for longer animation)
    timers.push(setTimeout(() => setSection1AnimationCycle(prev => prev + 1), 11000));

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [section1AnimationCycle]);

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
        'Expert-designed guided survey',
        'Comprehensive agreements',
        'Proprietary equity calculator',
        'Best practices and tips',
        'Up to 5 collaborators'
      ],
      featured: true
    },
    {
      name: 'Pro',
      price: '$800',
      description: 'Everything in Starter, plus',
      features: [
        'Attorney review',
        'Cofounder coaching',
        'Priority support'
      ]
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

  const allLogos = [
    { src: '/images/yc-logo.png', alt: 'Y Combinator', scale: 1 },
    { src: '/images/hubble-logo.png', alt: 'Hubble', scale: 1.1 },
    { src: '/images/a16z-logo.jpg', alt: 'a16z', scale: 1.1 },
    { src: '/images/berkeley-logo.png', alt: 'Berkeley', scale: 1.43 },
    { src: '/images/stanford-logo.png', alt: 'Stanford', scale: 1 },
    { src: '/images/sequoia-logo.png', alt: 'Sequoia', scale: 0.9 },
    { src: '/images/startupgrind-logo.png', alt: 'Startup Grind', scale: 1 }
  ];

  const [logos, setLogos] = useState([...allLogos]);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);

      setTimeout(() => {
        setLogos(prev => {
          const shuffled = [...prev];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        });

        setTimeout(() => {
          setIsFading(false);
        }, 200);
      }, 500);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

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
            <h1 className="font-heading text-[2.475rem] sm:text-[3.3rem] md:text-[4.125rem] lg:text-[4.95rem] font-normal text-gray-900 mb-4 md:mb-6 min-h-[110px] sm:min-h-[132px] md:min-h-[154px]">
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
                  // Navigate directly to app domain to avoid double redirect
                  const isProduction = window.location.hostname.includes('cherrytree.app');
                  if (isProduction) {
                    window.location.href = `${process.env.REACT_APP_APP_URL}/dashboard`;
                  } else {
                    navigate('/dashboard', { replace: true });
                  }
                }}
                className="button-shimmer bg-[#000000] text-white px-8 md:px-16 py-3 md:py-4 rounded-md text-sm md:text-base font-normal hover:bg-[#1a1a1a] transition"
              >
                Get started
              </button>
              <p className="text-xs md:text-sm text-gray-600">
                or <a href="https://cal.com/tim-he/15min" target="_blank" rel="noopener noreferrer" className="text-black underline hover:text-gray-900 font-semibold">Book a Free Consultation</a>
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
          <div className="mt-8 md:mt-12" style={{ perspective: '1000px' }}>
            <div
              className="tilty-card mx-auto"
              style={{
                width: '100%',
                maxWidth: 'min(1100px, 90vw)',
                height: 'auto',
                aspectRatio: '1100 / 595',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                transform: `rotateX(${cardTilt}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s ease-out',
                padding: '0',
                overflow: 'hidden'
              }}
            >
              <div
                className={section1Fading ? 'fade-out' : (section1Visible ? 'fade-in' : '')}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(to bottom, #fafbfc, #f5f7fa)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 20px 40px rgba(0, 0, 0, 0.08)',
                  opacity: 0
                }}
              >
                {/* LEFT SIDE - Survey Interface */}
                <div style={{
                  flex: '1.4',
                  display: 'flex',
                  background: '#ffffff'
                }}>
                  {/* Sidebar */}
                  <div style={{
                    width: '220px',
                    background: '#ffffff',
                    padding: '28px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    borderRight: '1px solid #e1e4e8'
                  }}>
                    <div className={section1Visible ? 'visible' : 'invisible'} style={{ padding: '0 12px', marginBottom: '16px', textAlign: 'left' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6b7789',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Sections
                      </span>
                    </div>
                    {[
                      { id: 1, name: 'Formation & Purpose' },
                      { id: 2, name: 'Cofounder Info' },
                      { id: 3, name: 'Equity Allocation' },
                      { id: 4, name: 'Vesting Schedule' },
                      { id: 5, name: 'Decision-Making' },
                      { id: 6, name: 'Intellectual Property' },
                      { id: 7, name: 'Roles & Responsibilities' },
                      { id: 8, name: 'Compensation' },
                      { id: 9, name: 'Conflict Resolution' },
                      { id: 10, name: 'Exit & Termination' }
                    ].map((section, idx) => (
                      <div
                        key={section.id}
                        className={section1Visible ? 'visible' : 'invisible'}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: idx === 0 ? '#f3f4f6' : 'transparent',
                          border: idx === 0 ? '1.5px solid #e5e7eb' : 'none',
                          boxShadow: idx === 0 ? '0 2px 4px rgba(0, 0, 0, 0.08)' : 'none',
                          fontSize: '12px',
                          color: idx === 0 ? '#0f1419' : '#6b7789',
                          fontWeight: idx === 0 ? 600 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          gap: '10px',
                          transition: 'all 0.15s ease',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{
                          fontSize: '11px',
                          opacity: 0.5,
                          fontWeight: 600,
                          minWidth: '16px',
                          textAlign: 'left',
                          flexShrink: 0
                        }}>{section.id}</span>
                        <span style={{
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{section.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Survey Questions */}
                  <div style={{
                    flex: 1,
                    padding: '40px 48px',
                    overflow: 'hidden',
                    background: 'transparent'
                  }}>
                    <div className={`${section1Visible ? 'visible' : 'invisible'}`} style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'flex-start' }}>
                      {/* Question 1 - Company Name */}
                      <div style={{ width: '100%', textAlign: 'left' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#4a5568',
                          marginBottom: '10px',
                          letterSpacing: '-0.01em',
                          textAlign: 'left'
                        }}>
                          What's your company's name?
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={typedCompanyName}
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              border: 'none',
                              borderBottom: '2px solid',
                              borderBottomColor: showCursor || typedCompanyName ? '#000000' : '#d1d5db',
                              borderRadius: '0',
                              fontSize: '15px',
                              color: '#374151',
                              background: 'transparent',
                              outline: 'none',
                              transition: 'all 0.2s ease',
                              fontFamily: 'Inter, system-ui, sans-serif'
                            }}
                          />
                          {showCursor && (
                            <span
                              className="absolute"
                              style={{
                                left: `${typedCompanyName.length * 8.8}px`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '2px',
                                height: '20px',
                                backgroundColor: '#0f1419',
                                animation: 'blink 1s step-end infinite',
                                borderRadius: '1px'
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Question 2 - Entity Type */}
                      <div style={{ width: '100%', textAlign: 'left' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#4a5568',
                          marginBottom: '10px',
                          letterSpacing: '-0.01em',
                          textAlign: 'left'
                        }}>
                          Legal structure?
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {['C-Corp', 'S-Corp', 'LLC'].map((type) => (
                            <label
                              key={type}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                fontFamily: 'Inter, system-ui, sans-serif'
                              }}
                            >
                              <input
                                type="radio"
                                name="entityType"
                                checked={selectedEntity === type}
                                readOnly
                                style={{
                                  marginRight: '12px',
                                  cursor: 'pointer',
                                  accentColor: '#0000FF'
                                }}
                              />
                              <span style={{
                                fontSize: '15px',
                                color: '#374151',
                                fontFamily: 'Inter, system-ui, sans-serif'
                              }}>{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Question 3 - Effective Date */}
                      <div style={{ width: '100%', textAlign: 'left', position: 'relative' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#4a5568',
                          marginBottom: '10px',
                          letterSpacing: '-0.01em',
                          textAlign: 'left'
                        }}>
                          Effective date of agreement?
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={selectedDate}
                          style={{
                            width: '100%',
                            padding: '12px 0',
                            border: 'none',
                            borderBottom: '2px solid',
                            borderBottomColor: showCalendar || selectedDate ? '#000000' : '#d1d5db',
                            borderRadius: '0',
                            fontSize: '15px',
                            color: '#374151',
                            background: 'transparent',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            cursor: 'pointer'
                          }}
                          placeholder="Select date"
                        />
                        {showCalendar && (
                          <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            background: '#ffffff',
                            border: '1.5px solid #e1e4e8',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                            zIndex: 10,
                            animation: 'fadeIn 0.2s ease-out',
                            width: '320px'
                          }}>
                            {/* Calendar Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '16px',
                              paddingBottom: '12px',
                              borderBottom: '1px solid #e1e4e8'
                            }}>
                              <span style={{
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#0f1419',
                                fontFamily: 'Inter, system-ui, sans-serif'
                              }}>January 2025</span>
                            </div>
                            {/* Calendar Grid */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(7, 1fr)',
                              gap: '4px'
                            }}>
                              {/* Day headers */}
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
                                <div key={idx} style={{
                                  textAlign: 'center',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#6b7789',
                                  padding: '8px 0',
                                  fontFamily: 'Inter, system-ui, sans-serif'
                                }}>{day}</div>
                              ))}
                              {/* Empty cells for padding */}
                              {[...Array(3)].map((_, idx) => (
                                <div key={`empty-${idx}`} />
                              ))}
                              {/* Date cells */}
                              {[...Array(31)].map((_, idx) => {
                                const date = idx + 1;
                                const isSelected = date === 8 && selectedDate;
                                return (
                                  <div
                                    key={date}
                                    style={{
                                      textAlign: 'center',
                                      padding: '8px',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      fontWeight: isSelected ? 600 : 400,
                                      color: isSelected ? '#ffffff' : '#0f1419',
                                      background: isSelected ? '#0056D6' : 'transparent',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      fontFamily: 'Inter, system-ui, sans-serif',
                                      animation: isSelected ? 'scaleIn 0.2s ease-out' : 'none'
                                    }}
                                  >
                                    {date}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{
                  width: '1px',
                  background: 'linear-gradient(to bottom, transparent, #e1e4e8 20%, #e1e4e8 80%, transparent)'
                }} />

                {/* RIGHT SIDE - Generated Agreement */}
                <div style={{
                  flex: '0.8',
                  padding: '32px',
                  background: '#f5f7fa',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Document Content */}
                  <div className={section1Visible ? 'visible' : 'invisible'} style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '28px',
                    border: '1px solid #e1e4e8',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    flex: 1
                  }}>
                    {/* Document Header */}
                    <div style={{
                      textAlign: 'center',
                      paddingBottom: '20px',
                      borderBottom: '2px solid #e1e4e8',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#0f1419',
                        margin: 0,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        fontFamily: 'Georgia, serif'
                      }}>
                        Cofounder Agreement
                      </h3>
                    </div>
                    {/* 1. Company Name */}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f1419',
                        marginBottom: '10px',
                        letterSpacing: '-0.01em',
                        textAlign: 'left'
                      }}>
                        Article I: Formation
                      </div>
                      <div style={{
                        fontSize: '13px',
                        lineHeight: '1.7',
                        color: '#4a5568',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        textAlign: 'left'
                      }}>
                        The undersigned cofounders hereby form <span style={{
                          fontWeight: 600,
                          color: typedCompanyName ? '#0f1419' : '#9ca3af',
                          background: '#e5e7eb',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>{typedCompanyName || '[Company Name]'}</span>, a company to be organized for the purpose of developing and operating a technology business.
                      </div>
                    </div>

                    {/* 2. Legal Structure */}
                    <div style={{ textAlign: 'left', marginTop: '20px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f1419',
                        marginBottom: '10px',
                        letterSpacing: '-0.01em',
                        textAlign: 'left'
                      }}>
                        Article II: Corporate Structure
                      </div>
                      <div style={{
                        fontSize: '13px',
                        lineHeight: '1.7',
                        color: '#4a5568',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        textAlign: 'left'
                      }}>
                        The Company shall be organized as a <span style={{
                          fontWeight: 600,
                          color: typedEntity ? '#0f1419' : '#9ca3af',
                          background: '#e5e7eb',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>{typedEntity || '[Legal Entity]'}</span>, and the cofounders agree to take all necessary steps to effect such organization.
                      </div>
                    </div>

                    {/* 3. Effective Date */}
                    <div style={{ textAlign: 'left', marginTop: '20px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f1419',
                        marginBottom: '10px',
                        letterSpacing: '-0.01em',
                        textAlign: 'left'
                      }}>
                        Article III: Effective Date
                      </div>
                      <div style={{
                        fontSize: '13px',
                        lineHeight: '1.7',
                        color: '#4a5568',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        textAlign: 'left'
                      }}>
                        This Agreement shall be effective as of <span style={{
                          fontWeight: 600,
                          color: typedDate ? '#0f1419' : '#9ca3af',
                          background: '#e5e7eb',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>{typedDate || '[Effective Date]'}</span>, and shall remain in effect until terminated in accordance with the terms herein.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - Combined heading + cards */}
      <section className="scroll-section scroll-section-early process-section px-4 md:px-6 pt-20 md:pt-32 lg:pt-36 pb-16 md:pb-24 lg:pb-30 relative" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative">
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
                              <span className="step1-email text-sm text-gray-400" style={{ minWidth: '140px' }}>cofounder@email.com</span>
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
                          <div className="step2-cursor-black absolute z-20" style={{ width: '18px', height: '18px' }}>
                            <svg viewBox="0 0 24 24" fill="#0056D6" style={{ width: '18px', height: '18px' }}>
                              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.72a.5.5 0 0 0-.44.49Z"/>
                            </svg>
                          </div>
                          <div className="step2-cursor-white absolute z-20" style={{ width: '18px', height: '18px' }}>
                            <svg viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" style={{ width: '18px', height: '18px' }}>
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
                            <div className="step3-scanner absolute left-2 right-2 h-0.5" style={{ backgroundColor: '#0056D6', boxShadow: '0 0 6px 1px rgba(0, 86, 214, 0.5)' }}></div>
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="scroll-section py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-header font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-center mb-10 md:mb-16 px-2">Turn your cofoundership<br />into a company, <em className="italic" style={{ display: 'inline-block', minWidth: '6ch', textAlign: 'left', letterSpacing: '-0.02em' }}>{typedToday || '\u00A0'}</em></h2>

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
                    {i === 0 ? (
                      <>
                        Generate a <span style={{ backgroundColor: '#E6F0FF', color: '#0056D6', padding: '2px 6px', borderRadius: '4px' }}>ready-to-use, fully customized</span> document in minutes and start building your partnership with confidence.
                      </>
                    ) : i === 1 ? (
                      <>
                        Use our <span style={{ backgroundColor: '#E6F0FF', color: '#0056D6', padding: '2px 6px', borderRadius: '4px' }}>proprietary equity calculator</span> to determine ownership. Instant, precise splits so everyone knows their stake.
                      </>
                    ) : i === 2 ? (
                      <>
                        Cofounder coaches and attorneys ready to help. We are here to guide you <span style={{ backgroundColor: '#E6F0FF', color: '#0056D6', padding: '2px 6px', borderRadius: '4px' }}>every step of the way</span>.
                      </>
                    ) : (
                      feature.description
                    )}
                  </p>
                  {/* Mobile animation container */}
                  <div className="mobile-visual">
                    {i === 0 && (
                      <div
                        className={`visual-content contract-animation-container ${activeFeature === 0 ? 'active' : ''} ${contractCardsFading ? 'contract-animation-fading' : ''}`}
                        style={{
                          opacity: 1,
                          pointerEvents: 'auto',
                          flexDirection: 'row',
                          gap: '20px',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: '0',
                          width: '100%',
                          height: '100%',
                          display: 'flex'
                        }}
                      >
                        <div className={contractCardsFading ? 'slide-out-left' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {[
                            { title: 'Cofounders', content: 'Steve Jobs\u00A0\u00A0Steve Woz\nRon Wayne' },
                            { title: 'Equity', content: '45% - 45% - 10%' },
                            { title: 'Vesting', content: '4 years with 1 year cliff' },
                            { title: 'And more', content: '' }
                          ].map((card, idx) => (
                            <div
                              key={idx}
                              className={contractCardsVisible ? 'card-visible' : 'card-hidden'}
                              style={{
                                width: '200px',
                                height: '100px',
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                '--delay': `${0.5 + idx * 0.3}s`,
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
                            ].map((line, idx) => (
                              <div
                                key={idx}
                                className={`text-line ${contractCardsVisible ? 'text-line-visible' : ''}`}
                                style={{
                                  width: line.width,
                                  '--line-delay': `${line.delay}s`,
                                  marginTop: line.paragraphStart ? '12px' : '0'
                                }}
                              />
                            ))}
                          </div>
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
                                stroke="#7c8590"
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
                    )}
                    {i === 1 && (
                      <div
                        className={`visual-content ${activeFeature === 1 ? 'active' : ''}`}
                        id="equity-calculator"
                        style={{
                          opacity: 1,
                          pointerEvents: 'auto',
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
                    )}
                    {i === 2 && (
                      <div
                        className={`visual-content ${activeFeature === 2 ? 'active' : ''} ${expertGuidanceFading ? 'fade-out' : ''}`}
                        id="expert-guidance"
                        style={{
                          opacity: 1,
                          pointerEvents: 'auto',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'stretch',
                          padding: '40px',
                          gap: '32px'
                        }}
                      >
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
                            alignSelf: 'flex-start'
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
                            alignSelf: 'flex-end'
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
                    )}
                  </div>
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
                        stroke="#7c8590"
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
      <section id="pricing" className="scroll-section py-16 md:py-24 px-4 md:px-6 relative" style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative">
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
                ref={plan.featured ? pricingCardRef : null}
                className={`bg-white p-6 md:p-8 rounded-lg flex flex-col border border-gray-300 ${
                  plan.featured
                    ? pricingCardAnimated ? 'pricing-card-bounce-in' : ''
                    : ''
                }`}
                style={plan.featured && !pricingCardAnimated ? {
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                } : {}}
              >
                <h3 className="text-lg md:text-xl font-normal mb-2 text-[#716B6B]">{plan.name}</h3>
                <div className="text-3xl md:text-4xl font-bold mb-2">{plan.price}</div>
                <p className="text-sm md:text-base text-gray-600 mb-6">{plan.description}</p>
                <button
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 });
                    } else {
                      // Navigate directly to app domain to avoid double redirect
                      const isProduction = window.location.hostname.includes('cherrytree.app');
                      if (isProduction) {
                        window.location.href = `${process.env.REACT_APP_APP_URL}/dashboard`;
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

          {/* Logo Grid */}
          <div className="mt-16 max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-y-6">
              {logos.map((logo, i) => (
                <div
                  key={`${logo.alt}-${i}`}
                  className="flex items-center justify-center w-20 md:w-24 transition-opacity duration-500"
                  style={{
                    opacity: isFading ? 0 : 1,
                    transitionDelay: isFading ? '0ms' : `${i * 200}ms`
                  }}
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="max-h-7 md:max-h-8 w-auto"
                    style={{ transform: `scale(${logo.scale * 1.1})` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="scroll-section py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 md:gap-20 lg:gap-80 items-start md:justify-center md:ml-32">
            <div className="flex-shrink-0 w-full md:w-auto text-center md:text-left">
              <h2 className="section-header font-heading text-3xl sm:text-4xl md:text-5xl font-medium">FAQs<span style={{ marginLeft: '0.05em', color: '#0056D6' }}>.</span></h2>
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
      <section className="scroll-section-full py-16 md:py-24 px-4 md:px-6 bg-white">
        <div className="max-w-6xl mx-auto bg-[#1a1a1a] rounded-xl md:rounded-2xl py-12 sm:py-16 md:py-[7.6rem] px-4 sm:px-6 md:px-12 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 2.4px, transparent 2.4px), radial-gradient(rgba(255,255,255,0.04) 2.4px, transparent 2.4px)', backgroundSize: '15px 15px', backgroundPosition: '0 0, 7.5px 7.5px' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 60%)' }}></div>
          <div className="headline-container">
            <h1 className="typing-title font-heading text-white">
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
                  // Navigate directly to app domain to avoid double redirect
                  const isProduction = window.location.hostname.includes('cherrytree.app');
                  if (isProduction) {
                    window.location.href = `${process.env.REACT_APP_APP_URL}/dashboard`;
                  } else {
                    navigate('/dashboard', { replace: true });
                  }
                }}
                className="button-shimmer bg-white text-[#1a1a1a] px-8 md:px-16 py-3 md:py-4 rounded-md text-sm md:text-base font-normal hover:bg-gray-100 transition"
              >
                Get started
              </button>
              <p className="text-xs md:text-sm text-gray-300">
                or <a href="https://cal.com/tim-he/15min" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-gray-200 font-semibold">Book a Free Consultation</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <style>{`
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

        .logo-flip {
          animation: logoChange 0.6s ease-in-out;
        }

        @keyframes logoChange {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(-8px);
            opacity: 0;
          }
          51% {
            transform: translateY(8px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .logo-scroller {
          position: relative;
          overflow: hidden;
          width: 100%;
          background: #fff;
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          padding: 20px 0;
        }

        .logo-track {
          display: flex;
          width: fit-content;
          animation: scroll 30s linear infinite;
          will-change: transform;
        }

        .logo-box {
          flex: 0 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 200px;
        }

        .logo-box img {
          max-height: 36px;
          max-width: 120px;
          object-fit: contain;
        }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-200px * 7)); }
        }

        @media (max-width: 768px) {
          .logo-box {
            width: 160px;
          }

          .logo-box img {
            max-height: 28px;
            max-width: 100px;
          }

          .logo-track {
            animation: scrollMobile 20s linear infinite;
          }

          @keyframes scrollMobile {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-160px * 7)); }
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

        .fade-in {
          opacity: 1 !important;
          transition: opacity 0.8s ease-in-out !important;
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

        /* Document lines for the transformation animation */
        .doc-line {
          height: 4px;
          background-color: #e5e7eb;
          border-radius: 2px;
          transform-origin: left;
          transform: scaleX(0);
        }

        .doc-line-visible {
          animation: drawDocLine 0.3s ease-out forwards;
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

        @keyframes drawDocLine {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
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

        /* Typing text animation */
        .typing-text {
          opacity: 0;
          animation: typeIn 0.5s ease-out forwards;
          animation-delay: var(--typing-delay);
        }

        /* Typing input animation */
        .typing-input {
          opacity: 0;
          animation: typeIn 0.5s ease-out forwards;
          animation-delay: var(--typing-delay);
        }

        @keyframes typeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

        /* Hide mobile animations on desktop */
        .mobile-visual {
          display: none !important;
        }

        @media (max-width: 968px) {
          .features-container {
            flex-direction: column;
            gap: 12px;
          }
          .features-left {
            order: 1;
          }
          .feature-visual {
            display: none;
          }
          .feature-card {
            padding: 20px;
            min-height: 120px;
            position: relative;
            transition: all 0.3s ease;
          }
          .feature-card.active {
            min-height: 380px;
            padding-bottom: 20px;
          }
          .feature-card .mobile-visual {
            display: none;
          }
          .feature-card.active .mobile-visual {
            display: flex !important;
            width: 100%;
            height: 220px;
            margin-top: 16px;
            align-items: center;
            justify-content: center;
            background: #fefefe;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
            position: relative;
          }
          .feature-title {
            font-size: 20px;
            margin-bottom: 12px;
          }
          .feature-description {
            font-size: 14px;
          }
          .feature-description.active {
            margin-bottom: 0;
          }
          /* Scale down animations for mobile */
          .mobile-visual .contract-animation-container,
          .mobile-visual .visual-content {
            transform: translate(-50%, -50%) scale(0.4);
            padding: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            opacity: 1 !important;
            left: 50%;
            top: 50%;
          }
          .mobile-visual #equity-calculator {
            transform: translate(-50%, -50%) scale(0.4) !important;
            position: absolute;
            left: 50%;
            top: 50%;
          }
          .mobile-visual #expert-guidance {
            transform: translate(-50%, -50%) scale(0.4) !important;
            position: absolute;
            left: 50%;
            top: 50%;
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
