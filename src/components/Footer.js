import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Footer({ bgColor, navigate: externalNavigate }) {
  const internalNavigate = useNavigate();
  const navigate = externalNavigate || internalNavigate;
  const showCta = !!bgColor;
  const [typedAnd, setTypedAnd] = useState('');
  const andTimeoutsRef = useRef([]);

  // Trigger footer animation when component mounts or becomes visible
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const footerContent = document.querySelector('.footer-content');
    if (footerContent) {
      observer.observe(footerContent);
    }

    return () => {
      if (footerContent) {
        observer.unobserve(footerContent);
      }
    };
  }, []);

  // Typing animation for "and"
  useEffect(() => {
    if (!showCta) return;
    andTimeoutsRef.current.forEach(id => clearTimeout(id));
    andTimeoutsRef.current = [];
    let isMounted = true;
    const andText = 'and';
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
  }, [showCta]);

  return (
    <footer className="relative pt-32 md:pt-44 pb-16 md:pb-20 mt-auto" style={{ backgroundColor: bgColor || '#ffffff' }}>
      <div className="max-w-7xl mx-auto relative z-10 px-4 md:px-6">
        <div className="footer-content bg-[#fbf6f5] rounded-xl md:rounded-2xl p-8 md:p-12 py-12 md:py-20">
          {/* CTA heading */}
          {showCta && (
            <div className="mb-16 md:mb-20 text-center">
              <h1 className="font-heading text-black text-[2.75rem] sm:text-[3rem] md:text-[3.63rem] font-medium leading-tight" style={{ margin: 0 }}>
                Protect your piece of the pie<br />
                <span className="inline-block" style={{ width: '3ch' }}>
                  <em className="italic">{typedAnd || '\u00A0'}</em>
                </span> your peace of mind.
              </h1>
              <div className="flex items-center justify-center gap-4 mt-10 md:mt-12">
                <button
                  onClick={() => {
                    const isProduction = window.location.hostname.includes('cherrytree.app');
                    if (isProduction) {
                      window.location.href = `${process.env.REACT_APP_APP_URL}/dashboard`;
                    } else {
                      navigate('/dashboard', { replace: true });
                    }
                  }}
                  className="bg-[#06271D] text-white px-6 md:px-10 py-3 md:py-4 rounded-md text-sm md:text-base font-normal hover:bg-[#0a3d2e] transition"
                >
                  Get started
                </button>
                <a href="https://cal.com/tim-he/15min" target="_blank" rel="noopener noreferrer" className="group text-black hover:text-gray-600 text-sm md:text-base font-normal transition">
                  Book a demo <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>
          )}

          {/* Divider */}
          {showCta && <div className="border-t border-gray-300 mb-10 md:mb-12"></div>}

          {/* Logo/copyright + links row */}
          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12">
            <div className="footer-cascade-1 text-left">
              <div className="mb-4">
                <img
                  src="/images/cherrytree-logo.png"
                  alt="Cherrytree"
                  style={{ height: '32px', width: 'auto' }}
                />
              </div>
              <p className="text-gray-500 text-sm">© 2026 Cherrytree, LLC</p>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-16 w-full md:w-auto justify-items-start text-left">
              <div className="footer-cascade-2 text-left">
                <h4 className="text-black text-sm mb-4 uppercase text-left">Product</h4>
                <ul className="space-y-4 text-sm text-left">
                  <li className="text-left"><button onClick={() => {
                    const isProduction = window.location.hostname.includes('cherrytree.app');
                    if (isProduction) {
                      window.location.href = 'https://my.cherrytree.app/dashboard';
                    } else {
                      navigate('/dashboard', { replace: true });
                    }
                  }} className="text-gray-500 hover:text-black transition nav-link-underline text-left">Contract Creator</button></li>
                  <li className="text-left"><button onClick={() => navigate('/equity-calculator')} className="text-gray-500 hover:text-black transition nav-link-underline text-left">Equity Calculator</button></li>
                  <li className="text-left"><button onClick={() => navigate('/pricing')} className="text-gray-500 hover:text-black transition nav-link-underline text-left">Pricing</button></li>
                </ul>
              </div>

              <div className="footer-cascade-3 text-left">
                <h4 className="text-black text-sm mb-4 uppercase text-left">Resources</h4>
                <ul className="space-y-4 text-sm text-left">
                  <li className="text-left"><a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition nav-link-underline">Newsletter</a></li>
                  <li className="text-left"><a href="https://app.hubble.social/timhe" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition nav-link-underline">Coaching</a></li>
                  <li className="text-left"><button onClick={() => navigate('/attorney')} className="text-gray-500 hover:text-black transition nav-link-underline text-left">Attorney</button></li>
                </ul>
              </div>

              <div className="footer-cascade-4 text-left">
                <h4 className="text-black text-sm mb-4 uppercase text-left">Company</h4>
                <ul className="space-y-4 text-sm text-left">
                  <li className="text-left"><button onClick={() => navigate('/privacy')} className="text-gray-500 hover:text-black transition nav-link-underline text-left">Privacy</button></li>
                  <li className="text-left"><button onClick={() => navigate('/terms')} className="text-gray-500 hover:text-black transition nav-link-underline text-left">Terms</button></li>
                  <li className="text-left"><button onClick={() => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 })} className="text-gray-500 hover:text-black transition nav-link-underline text-left">Contact</button></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
