import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user } = useUser();

  return (
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
            <button onClick={() => navigate('/equity-calculator')} className={`${location.pathname === '/equity-calculator' ? 'text-black' : 'text-[#808080]'} hover:text-black transition`}>Equity Calculator</button>
            <a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-[#808080] hover:text-black transition">Newsletter</a>
            <button onClick={() => navigate('/pricing')} className={`${location.pathname === '/pricing' ? 'text-black' : 'text-[#808080]'} hover:text-black transition`}>Pricing</button>
            <button onClick={() => navigate('/about')} className={`${location.pathname === '/about' ? 'text-black' : 'text-[#808080]'} hover:text-black transition`}>About</button>
          </nav>

          <div className="hidden md:flex items-center gap-4 text-sm">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-[#808080] hover:text-black transition"
              >
                My Projects
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
  );
}

export default Header;
