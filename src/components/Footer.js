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
            <div className="flex items-center gap-2 mb-4">
              <svg width="32" height="32" viewBox="22 22 56 56" xmlns="http://www.w3.org/2000/svg">
                <path d="M70.63,61.53c-.77-5.18-5.27-6.64-10.45-5.86l-.39.06C57.39,47.09,53,42.27,49.53,39.66c3.65.71,6.83.23,9.74-3.08,1.9-2.18,2.83-5.14,5.75-7.53a.46.46,0,0,0-.17-.8c-5.07-1.4-11.84-1.08-15.43,3a13.83,13.83,0,0,0-3.17,6.38,18.48,18.48,0,0,0-4.87-1.73.35.35,0,0,0-.41.3l-.23,1.62a.35.35,0,0,0,.28.4A17.86,17.86,0,0,1,45.74,40c2.49,6.14-2.9,13.55-5.88,17-4.7-1.25-9-.37-10.28,4.33a8.89,8.89,0,1,0,17.15,4.67c1.16-4.26-1.42-7.08-5.4-8.54A37.59,37.59,0,0,0,45,52.51c2.59-4.14,3.57-8,2.91-11.25l.42.3A25.14,25.14,0,0,1,58.47,56c-4.28,1.08-7.25,3.73-6.57,8.31a9.47,9.47,0,1,0,18.73-2.79Z" fill="white"/>
              </svg>
              <span className="text-white text-xl font-semibold">Cherrytree</span>
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
                <li><a href="#" className="text-gray-400 hover:text-white transition">Attorney</a></li>
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
