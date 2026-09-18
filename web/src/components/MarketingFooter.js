import React from 'react';
import { useNavigate } from 'react-router-dom';
import { goToDashboard } from './MarketingNav';

function MarketingFooter() {
  const navigate = useNavigate();
  const goDash = () => goToDashboard(navigate);

  return (
    <footer className="lp-footer">
      <div className="lp-footer-top">
        <div className="lp-footer-brand">
          <button className="lp-footer-logo" onClick={() => navigate('/')}>
            <img src="/images/cherries.png" alt="Cherrytree" width={20} height={20}/>
            <span className="lp-footer-logo-name">Cherrytree</span>
          </button>
          <span className="lp-footer-copy">© 2026 Cherrytree, LLC</span>
        </div>
        <div className="lp-footer-cols">
          <div className="lp-footer-col">
            <div className="lp-footer-col-head">Product</div>
            <ul className="lp-footer-links">
              <li><button onClick={goDash}>Contract Creator</button></li>
              <li><button onClick={() => navigate('/equity-calculator')}>Equity Calculator</button></li>
              <li><button onClick={() => navigate('/pricing')}>Pricing</button></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-head">Resources</div>
            <ul className="lp-footer-links">
              <li><a href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer">Newsletter</a></li>
              <li><a href="https://app.hubble.social/timhe" target="_blank" rel="noopener noreferrer">Coaching</a></li>
              <li><button onClick={() => navigate('/attorney')}>Attorney</button></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-head">Company</div>
            <ul className="lp-footer-links">
              <li><button onClick={() => navigate('/privacy')}>Privacy</button></li>
              <li><button onClick={() => navigate('/terms')}>Terms</button></li>
              <li><button onClick={() => navigate('/contact')}>Contact</button></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default MarketingFooter;
