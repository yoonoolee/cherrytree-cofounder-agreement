import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, loading } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="fixed top-0 left-0 right-0 bg-white z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-3 py-4">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="/images/cherrytree-logo.png"
              alt="Cherrytree"
              style={{ height: '32px', width: 'auto' }}
            />
          </div>

          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2 text-sm">
            <button onClick={() => navigate('/equity-calculator')} className={`${location.pathname === '/equity-calculator' ? 'text-black' : 'text-[#808080]'} hover:text-black transition nav-link-underline`}>Equity Calculator</button>
            <button onClick={() => navigate('/pricing')} className={`${location.pathname === '/pricing' ? 'text-black' : 'text-[#808080]'} hover:text-black transition nav-link-underline`}>Pricing</button>
            <button onClick={() => navigate('/about')} className={`${location.pathname === '/about' ? 'text-black' : 'text-[#808080]'} hover:text-black transition nav-link-underline`}>About</button>
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
                className="text-[#808080] hover:text-black transition nav-link-underline"
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
                className="text-[#808080] hover:text-black transition nav-link-underline"
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
              className="button-shimmer bg-[#000000] text-white px-5 py-2.5 rounded hover:bg-[#1a1a1a] transition"
            >
              Get started
            </button>
          </div>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 text-gray-700 hover:text-black transition"
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
              <button
                onClick={() => handleNavigation('/equity-calculator')}
                className={`${location.pathname === '/equity-calculator' ? 'text-black bg-gray-50' : 'text-[#808080]'} hover:text-black hover:bg-gray-50 transition px-4 py-3 text-left text-sm`}
              >
                Equity Calculator
              </button>
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
