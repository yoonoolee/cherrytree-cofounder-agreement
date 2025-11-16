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
    <footer className="relative bg-black text-white pt-24 pb-20 px-6 mt-auto">
      {/* Rounded top border */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-white rounded-b-[48px]"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="footer-content flex flex-col md:flex-row justify-between gap-12">
          {/* Left side - Logo and copyright */}
          <div className="footer-cascade-1">
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
          <div className="grid grid-cols-3 gap-12 ml-auto">
            <div className="footer-cascade-2">
              <h4 className="text-white text-sm mb-4">Product</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition">Contract Creator</button></li>
                <li><button onClick={() => navigate('/equity-calculator')} className="text-gray-400 hover:text-white transition">Equity Calculator</button></li>
                <li><button onClick={() => navigate('/pricing')} className="text-gray-400 hover:text-white transition">Pricing</button></li>
              </ul>
            </div>

            <div className="footer-cascade-3">
              <h4 className="text-white text-sm mb-4">Resources</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Newsletter</a></li>
                <li><a href="https://app.hubble.social/timhe" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Coaching</a></li>
                <li><button onClick={() => navigate('/attorney')} className="text-gray-400 hover:text-white transition">Attorney</button></li>
              </ul>
            </div>

            <div className="footer-cascade-4">
              <h4 className="text-white text-sm mb-4">Company</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => navigate('/privacy')} className="text-gray-400 hover:text-white transition">Privacy</button></li>
                <li><button onClick={() => navigate('/terms')} className="text-gray-400 hover:text-white transition">Terms</button></li>
                <li><button onClick={() => navigate('/contact')} className="text-gray-400 hover:text-white transition">Contact</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
