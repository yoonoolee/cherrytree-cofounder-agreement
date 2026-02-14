import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

function Header({ variant = 'light' }) {
  const isDark = variant === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, loading } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHidden(currentScrollY > lastScrollY.current && currentScrollY > 10);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-200 ${hidden ? '-translate-y-full' : 'translate-y-0'} ${isDark ? 'bg-[#06271D]' : 'bg-white'}`}>
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
            <div className="relative" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
              <button className={`flex items-center gap-1 ${isDark ? 'text-white hover:text-gray-200' : 'text-[#808080] hover:text-black'} transition`}>
                Products
                <svg className={`w-3 h-3 transition-transform ${productsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {productsOpen && (
                <div className="absolute top-full left-0 pt-2 w-48">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                  <button
                    onClick={() => {
                      const isProduction = window.location.hostname.includes('cherrytree.app');
                      if (isProduction) {
                        window.location.href = 'https://my.cherrytree.app/dashboard';
                      } else {
                        navigate('/dashboard', { replace: true });
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-[#808080] hover:text-black hover:bg-gray-50 transition"
                  >
                    Contract Creator
                  </button>
                  <button
                    onClick={() => navigate('/equity-calculator')}
                    className="w-full text-left px-4 py-2 text-[#808080] hover:text-black hover:bg-gray-50 transition"
                  >
                    Equity Calculator
                  </button>
                  <a
                    href="https://cherrytree.beehiiv.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left px-4 py-2 text-[#808080] hover:text-black hover:bg-gray-50 transition"
                  >
                    Newsletter
                  </a>
                  <a
                    href="https://app.hubble.social/timhe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left px-4 py-2 text-[#808080] hover:text-black hover:bg-gray-50 transition"
                  >
                    Coaching
                  </a>
                </div>
                </div>
              )}
            </div>
            <button onClick={() => navigate('/pricing')} className={`${isDark ? 'text-white hover:text-gray-200' : location.pathname === '/pricing' ? 'text-black' : 'text-[#808080] hover:text-black'} transition nav-link-underline`}>Pricing</button>
            <button onClick={() => navigate('/about')} className={`${isDark ? 'text-white hover:text-gray-200' : location.pathname === '/about' ? 'text-black' : 'text-[#808080] hover:text-black'} transition nav-link-underline`}>About</button>
          </nav>

          <div className="hidden md:flex items-center gap-4 text-sm">
            {!loading && (user ? (
              <button
                onClick={() => {
                  // Navigate directly to my.cherrytree.app to avoid any redirect issues
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
                  // Navigate directly to my.cherrytree.app/login to avoid double load
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
            ))}
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
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8h16M4 16h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="flex flex-col py-4">
              <div className="px-4 py-2 text-xs text-gray-400 uppercase">Products</div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  const isProduction = window.location.hostname.includes('cherrytree.app');
                  if (isProduction) {
                    window.location.href = 'https://my.cherrytree.app/dashboard';
                  } else {
                    navigate('/dashboard', { replace: true });
                  }
                }}
                className="text-[#808080] hover:text-black hover:bg-gray-50 transition px-6 py-3 text-left text-sm"
              >
                Contract Creator
              </button>
              <button
                onClick={() => handleNavigation('/equity-calculator')}
                className={`${location.pathname === '/equity-calculator' ? 'text-black bg-gray-50' : 'text-[#808080]'} hover:text-black hover:bg-gray-50 transition px-6 py-3 text-left text-sm`}
              >
                Equity Calculator
              </button>
              <a
                href="https://cherrytree.beehiiv.com/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#808080] hover:text-black hover:bg-gray-50 transition px-6 py-3 text-left text-sm"
              >
                Newsletter
              </a>
              <a
                href="https://app.hubble.social/timhe"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#808080] hover:text-black hover:bg-gray-50 transition px-6 py-3 text-left text-sm"
              >
                Coaching
              </a>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => handleNavigation('/pricing')}
                className={`${location.pathname === '/pricing' ? 'text-black bg-gray-50' : 'text-[#808080]'} hover:text-black hover:bg-gray-50 transition px-4 py-3 text-left text-sm`}
              >
                Pricing
              </button>
              <button
                onClick={() => handleNavigation('/about')}
                className={`${location.pathname === '/about' ? 'text-black bg-gray-50' : 'text-[#808080]'} hover:text-black hover:bg-gray-50 transition px-4 py-3 text-left text-sm`}
              >
                About
              </button>

              <div className="border-t border-gray-200 mt-2 pt-2">
                {!loading && (user ? (
                  <button
                    onClick={handleDashboardNavigation}
                    className="text-[#808080] hover:text-black hover:bg-gray-50 transition px-4 py-3 text-left text-sm w-full"
                  >
                    Dashboard
                  </button>
                ) : (
                  <button
                    onClick={handleLoginNavigation}
                    className="text-[#808080] hover:text-black hover:bg-gray-50 transition px-4 py-3 text-left text-sm w-full"
                  >
                    Login
                  </button>
                ))}
                <button
                  onClick={handleDashboardNavigation}
                  className="button-shimmer bg-[#000000] text-white px-4 py-3 rounded hover:bg-[#1a1a1a] transition mx-4 mt-2 text-sm w-[calc(100%-2rem)]"
                >
                  Get started
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
