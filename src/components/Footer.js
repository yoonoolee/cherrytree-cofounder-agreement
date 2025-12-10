import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Footer() {
  const navigate = useNavigate();

  // Trigger footer animation when component mounts or becomes visible
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1, // Lower threshold for footer
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

  return (
    <footer className="relative bg-black text-white pt-24 pb-20 mt-auto">
      {/* Rounded top border */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-white rounded-b-[48px]"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="footer-content flex flex-col md:flex-row justify-between gap-12 px-3">
          {/* Left side - Logo and copyright */}
          <div className="footer-cascade-1 text-left">
            <div className="mb-4">
              <img
                src="/images/cherrytree-logo.png"
                alt="Cherrytree"
                style={{ height: '32px', width: 'auto', filter: 'invert(1)' }}
              />
            </div>
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Cherrytree</p>
          </div>

          {/* Right side - Three columns */}
          <div className="grid grid-cols-3 gap-6 md:gap-16 w-full md:w-auto justify-items-start text-left">
            <div className="footer-cascade-2 text-left">
              <h4 className="text-white text-sm mb-4 uppercase text-left">Product</h4>
              <ul className="space-y-4 text-sm text-left">
                <li className="text-left"><button onClick={() => {
                  const isProduction = window.location.hostname.includes('cherrytree.app');
                  if (isProduction) {
                    window.location.href = 'https://my.cherrytree.app/dashboard';
                  } else {
                    navigate('/dashboard', { replace: true });
                  }
                }} className="text-gray-400 hover:text-white transition nav-link-underline text-left">Contract Creator</button></li>
                <li className="text-left"><button onClick={() => navigate('/equity-calculator')} className="text-gray-400 hover:text-white transition nav-link-underline text-left">Equity Calculator</button></li>
                <li className="text-left"><button onClick={() => navigate('/pricing')} className="text-gray-400 hover:text-white transition nav-link-underline text-left">Pricing</button></li>
              </ul>
            </div>

            <div className="footer-cascade-3 text-left">
              <h4 className="text-white text-sm mb-4 uppercase text-left">Resources</h4>
              <ul className="space-y-4 text-sm text-left">
                <li className="text-left"><a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition nav-link-underline">Newsletter</a></li>
                <li className="text-left"><a href="https://app.hubble.social/timhe" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition nav-link-underline">Coaching</a></li>
                <li className="text-left"><button onClick={() => navigate('/attorney')} className="text-gray-400 hover:text-white transition nav-link-underline text-left">Attorney</button></li>
              </ul>
            </div>

            <div className="footer-cascade-4 text-left">
              <h4 className="text-white text-sm mb-4 uppercase text-left">Company</h4>
              <ul className="space-y-4 text-sm text-left">
                <li className="text-left"><button onClick={() => navigate('/privacy')} className="text-gray-400 hover:text-white transition nav-link-underline text-left">Privacy</button></li>
                <li className="text-left"><button onClick={() => navigate('/terms')} className="text-gray-400 hover:text-white transition nav-link-underline text-left">Terms</button></li>
                <li className="text-left"><button onClick={() => window.Tally?.openPopup('2EEB99', { layout: 'modal', width: 700 })} className="text-gray-400 hover:text-white transition nav-link-underline text-left">Contact</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
