import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { usePageMeta } from '../hooks/usePageMeta';
import Footer from '../components/Footer';
import PricingCard from '../components/PricingCard';
import { PRICING_PLANS } from '../constants/pricing';

function PricingPage() {
  const navigate = useNavigate();
  useScrollAnimation();
  const [openFaq, setOpenFaq] = useState(null);

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

  // SEO meta tags
  usePageMeta({
    title: 'Pricing - Cherrytree | Starter $200, Pro $800',
    description: 'Affordable cofounder agreement pricing for startups. Starter plan at $200 includes real-time collaboration and instant agreements. Pro plan at $800 adds attorney review and coaching.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Pricing' }
    ]
  });

  // Add FAQ schema for SEO
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    script.id = 'faq-schema';
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById('faq-schema');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Trigger hero content fade-in on mount
  useEffect(() => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      setTimeout(() => {
        heroContent.classList.add('section-visible');
      }, 100);
    }
  }, []);

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
      <section className="pt-24 md:pt-32 pb-16 md:pb-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="hero-content text-center mb-10 md:mb-16">
            <h1 className="font-heading text-3xl sm:text-4xl md:text-[56px] font-normal mb-4 md:mb-6">
              Simple, transparent pricing<span style={{ marginLeft: '0.05em' }}>.</span>
            </h1>
            <p className="text-sm md:text-[16px] font-normal" style={{ color: '#716B6B' }}>
              Choose the plan that's right for your team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
            {PRICING_PLANS.map((plan, i) => (
              <PricingCard
                key={i}
                plan={plan}
                buttonText={plan.name === 'Enterprise' ? 'Contact sales' : 'Get started'}
                onButtonClick={() => {
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
              />
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
                    transitionDelay: isFading ? '0ms' : `${i * 100}ms`
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
                    <td className="py-4 px-6 text-gray-700">Priority support</td>
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
              FAQs<span style={{ marginLeft: '0.05em', color: '#0056D6' }}>.</span>
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

      <style>{`
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
        }
      `}</style>
    </div>
  );
}

export default PricingPage;
