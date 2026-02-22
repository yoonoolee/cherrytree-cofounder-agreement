import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

function Header({ variant = 'light', onProductsHover }) {
  const isDark = variant === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, loading } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const productsTimeout = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (mobileMenuOpen) return;
      const currentScrollY = window.scrollY;
      setHidden(currentScrollY > lastScrollY.current && currentScrollY > 10);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      setHidden(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleProductsEnter = () => {
    clearTimeout(productsTimeout.current);
    setProductsOpen(true);
    onProductsHover?.(true);
  };

  const handleProductsLeave = () => {
    clearTimeout(productsTimeout.current);
    productsTimeout.current = setTimeout(() => {
      setProductsOpen(false);
      onProductsHover?.(false);
    }, 50);
  };

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    setMobileProductsOpen(false);
    navigate(path);
  };

  const handleDashboardNavigation = () => {
    setMobileMenuOpen(false);
    const isProduction = window.location.hostname.includes('cherrytree.app');
    if (isProduction) {
      window.location.href = 'https://my.cherrytree.app/dashboard';
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleLoginNavigation = () => {
    setMobileMenuOpen(false);
    const isProduction = window.location.hostname.includes('cherrytree.app');
    if (isProduction) {
      window.location.href = 'https://my.cherrytree.app/login';
    } else {
      navigate('/login');
    }
  };

  const headerBg = isDark ? 'bg-[#06271D]' : 'bg-white';

  return (
    <>
    {/* Backdrop to close mobile menu */}
    {mobileMenuOpen && (
      <div
        className="md:hidden fixed inset-0 z-40"
        onClick={() => setMobileMenuOpen(false)}
      />
    )}
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-200 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
      style={{ pointerEvents: 'none' }}
    >
      <header className={headerBg} style={{ pointerEvents: 'auto' }} onMouseLeave={handleProductsLeave}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-3 py-4">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/images/cherrytree-logo.png"
                alt="Cherrytree"
                style={{ height: '32px', width: 'auto', ...(isDark ? { filter: 'brightness(0) invert(1)' } : {}) }}
              />
            </div>

            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2 text-sm">
              <div className="relative" onMouseEnter={handleProductsEnter}>
                <button className={`flex items-center gap-1 ${isDark ? 'text-white hover:text-gray-200' : 'text-[#808080] hover:text-black'} transition`}>
                  Products
                  <svg className={`w-3 h-3 transition-transform ${productsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <button onMouseEnter={() => { clearTimeout(productsTimeout.current); setProductsOpen(false); onProductsHover?.(false); }} onClick={() => navigate('/pricing')} className={`${isDark ? 'text-white hover:text-gray-200' : location.pathname === '/pricing' ? 'text-black' : 'text-[#808080] hover:text-black'} transition nav-link-underline`}>Pricing</button>
              <button onMouseEnter={() => { clearTimeout(productsTimeout.current); setProductsOpen(false); onProductsHover?.(false); }} onClick={() => navigate('/about')} className={`${isDark ? 'text-white hover:text-gray-200' : location.pathname === '/about' ? 'text-black' : 'text-[#808080] hover:text-black'} transition nav-link-underline`}>About</button>
            </nav>

            <div className="hidden md:flex items-center gap-4 text-sm">
              {loading ? (
                <span className="invisible text-sm">Login</span>
              ) : user ? (
                <button
                  onClick={() => {
                    const isProduction = window.location.hostname.includes('cherrytree.app');
                    if (isProduction) {
                      window.location.href = 'https://my.cherrytree.app/dashboard';
                    } else {
                      navigate('/dashboard', { replace: true });
                    }
                  }}
                  className={`${isDark ? 'text-white hover:text-gray-200' : 'text-[#808080] hover:text-black'} transition nav-link-underline`}
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => {
                    const isProduction = window.location.hostname.includes('cherrytree.app');
                    if (isProduction) {
                      window.location.href = 'https://my.cherrytree.app/login';
                    } else {
                      navigate('/login');
                    }
                  }}
                  className={`${isDark ? 'text-white hover:text-gray-200' : 'text-[#808080] hover:text-black'} transition nav-link-underline`}
                >
                  Login
                </button>
              )}
              <button
                onClick={() => {
                  const isProduction = window.location.hostname.includes('cherrytree.app');
                  if (isProduction) {
                    window.location.href = 'https://my.cherrytree.app/dashboard';
                  } else {
                    navigate('/dashboard', { replace: true });
                  }
                }}
                className={`${isDark ? 'button-shimmer-dark bg-white text-[#06271D] hover:bg-gray-100' : 'button-shimmer bg-[#000000] text-white hover:bg-[#1a1a1a]'} px-5 py-2.5 rounded transition`}
              >
                Get started
              </button>
            </div>

            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden flex items-center justify-center w-10 h-10 ${isDark ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-black'} transition`}
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 8h16M4 16h16"
                  />
                )}
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`md:hidden bg-white transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-[calc(100vh-64px)] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ pointerEvents: mobileMenuOpen ? 'auto' : 'none', borderBottom: mobileMenuOpen ? '1px solid #e5e7eb' : 'none', boxShadow: mobileMenuOpen ? '0 4px 12px rgba(0,0,0,0.08)' : 'none', borderRadius: '0 0 12px 12px' }}
      >
        <nav className="flex flex-col py-4 px-2">
          <button
            onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
            className="px-6 py-3 text-sm text-gray-500 uppercase flex items-center gap-1.5 w-full text-left"
          >
            Products
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileProductsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${mobileProductsOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setMobileProductsOpen(false);
                const isProduction = window.location.hostname.includes('cherrytree.app');
                if (isProduction) {
                  window.location.href = 'https://my.cherrytree.app/dashboard';
                } else {
                  navigate('/dashboard', { replace: true });
                }
              }}
              className="text-gray-600 active:bg-gray-50 transition px-10 py-3 text-left text-base w-full"
            >
              Contract Creator
            </button>
            <button
              onClick={() => { setMobileProductsOpen(false); handleNavigation('/equity-calculator'); }}
              className="text-gray-600 active:bg-gray-50 transition px-10 py-3 text-left text-base w-full"
            >
              Equity Calculator
            </button>
            <a
              href="https://cherrytree.beehiiv.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { setMobileMenuOpen(false); setMobileProductsOpen(false); }}
              className="text-gray-600 active:bg-gray-50 transition px-10 py-3 text-left text-base block"
            >
              Newsletter
            </a>
            <a
              href="https://app.hubble.social/timhe"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { setMobileMenuOpen(false); setMobileProductsOpen(false); }}
              className="text-gray-600 active:bg-gray-50 transition px-10 py-3 text-left text-base block"
            >
              Coaching
            </a>
          </div>
          <button
            onClick={() => handleNavigation('/pricing')}
            className="text-gray-500 active:bg-gray-50 transition px-6 py-3 text-left text-sm uppercase"
          >
            Pricing
          </button>
          <button
            onClick={() => handleNavigation('/about')}
            className="text-gray-500 active:bg-gray-50 transition px-6 py-3 text-left text-sm uppercase"
          >
            About
          </button>

          <div className="mt-2 pt-2">
            {!loading && (user ? (
              <button
                onClick={handleDashboardNavigation}
                className="text-gray-500 active:bg-gray-50 transition px-6 py-3 text-left text-sm uppercase w-full"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={handleLoginNavigation}
                className="text-gray-500 active:bg-gray-50 transition px-6 py-3 text-left text-sm uppercase w-full"
              >
                Login
              </button>
            ))}
            <button
              onClick={handleDashboardNavigation}
              className="button-shimmer bg-[#06271D] text-white px-6 py-3 rounded transition mx-6 mt-3 text-base w-[calc(100%-3rem)]"
            >
              Get started
            </button>
          </div>
        </nav>
      </div>

      {/* Products mega menu card - detached below header */}
      {productsOpen && (
        <div className="hidden md:flex justify-center px-4">
          <div
            style={{ pointerEvents: 'auto', paddingTop: '12px' }}
            className="max-w-3xl w-full"
            onMouseEnter={handleProductsEnter}
            onMouseLeave={handleProductsLeave}
          >
          <div
            className="rounded-lg shadow-2xl p-8 w-full grid grid-cols-2 gap-4"
            style={{ backgroundColor: '#faf6f5', border: '2px solid #d4d4d4' }}
          >
            <button
              onClick={() => {
                setProductsOpen(false);
                const isProduction = window.location.hostname.includes('cherrytree.app');
                if (isProduction) {
                  window.location.href = 'https://my.cherrytree.app/dashboard';
                } else {
                  navigate('/dashboard', { replace: true });
                }
              }}
              className="text-left p-4 rounded-lg transition group"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eae6e5'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <h4 className="font-normal mb-1 flex items-center gap-2 text-black"><span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#06271D]"></span>Contract Creator</h4>
              <p className="text-sm text-gray-500">Generate a complete cofounder agreement</p>
            </button>
            <button
              onClick={() => { setProductsOpen(false); navigate('/equity-calculator'); }}
              className="text-left p-4 rounded-lg transition group"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eae6e5'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <h4 className="font-normal mb-1 flex items-center gap-2 text-black"><span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#06271D]"></span>Equity Calculator</h4>
              <p className="text-sm text-gray-500">Determine fair ownership splits instantly</p>
            </button>
            <a
              href="https://cherrytree.beehiiv.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setProductsOpen(false)}
              className="text-left p-4 rounded-lg transition group"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eae6e5'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <h4 className="font-normal mb-1 flex items-center gap-2 text-black"><span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#06271D]"></span>Newsletter</h4>
              <p className="text-sm text-gray-500">Stay updated with startup insights and tips</p>
            </a>
            <a
              href="https://app.hubble.social/timhe"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setProductsOpen(false)}
              className="text-left p-4 rounded-lg transition group"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eae6e5'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <h4 className="font-normal mb-1 flex items-center gap-2 text-black"><span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#06271D]"></span>Coaching</h4>
              <p className="text-sm text-gray-500">Get expert guidance from cofounder coaches</p>
            </a>
            <div className="col-span-2 border-t border-gray-300 mt-0 pt-2 pb-0 flex justify-end -mb-4">
              <button
                onClick={() => { setProductsOpen(false); navigate('/pricing'); }}
                className="group text-sm text-gray-500 hover:text-black transition"
              >
                PRICING <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default Header;
