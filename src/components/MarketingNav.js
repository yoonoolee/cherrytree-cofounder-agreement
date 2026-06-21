import React from 'react';
import { useNavigate } from 'react-router-dom';

function goToDashboard(navigate) {
  const isProd = window.location.hostname.includes('cherrytree.app');
  if (isProd) window.location.href = `${process.env.REACT_APP_APP_URL}/dashboard`;
  else navigate('/dashboard', { replace: true });
}

function MarketingNav() {
  const navigate = useNavigate();
  const goDash = () => goToDashboard(navigate);

  return (
    <nav className="lp-nav">
      <button className="lp-nav-logo" onClick={() => navigate('/')}>
        <img src="/images/cherries.png" alt="Cherrytree" width={22} height={22} />
        <span className="lp-nav-logo-text">Cherrytree</span>
      </button>
      <ul className="lp-nav-links">
        <li className="lp-has-dd">
          <a href="#">Products <span className="lp-chevron">▾</span></a>
          <div className="lp-dd">
            <div className="lp-dd-inner">
              <button className="lp-dd-item" onClick={() => navigate('/equity-calculator')}><span className="lp-dd-name">Equity Calculator</span><span className="lp-dd-sub">Fair splits, instantly</span></button>
              <button className="lp-dd-item" onClick={goDash}><span className="lp-dd-name">Contract Creator</span><span className="lp-dd-sub">Guided agreement builder</span></button>
              <button className="lp-dd-item" onClick={() => navigate('/attorney')}><span className="lp-dd-name">Attorney Review</span><span className="lp-dd-sub">Legal review on demand</span></button>
            </div>
          </div>
        </li>
        <li className="lp-has-dd">
          <a href="#">Resources <span className="lp-chevron">▾</span></a>
          <div className="lp-dd">
            <div className="lp-dd-inner">
              <a className="lp-dd-item" href="https://app.hubble.social/timhe" target="_blank" rel="noopener noreferrer"><span className="lp-dd-name">Coaching</span><span className="lp-dd-sub">1-on-1 cofounder guidance</span></a>
              <a className="lp-dd-item" href="https://cherrytree.beehiiv.com/" target="_blank" rel="noopener noreferrer"><span className="lp-dd-name">Newsletter</span><span className="lp-dd-sub">Founder insights, weekly</span></a>
              <button className="lp-dd-item" onClick={() => navigate('/attorney')}><span className="lp-dd-name">Attorney</span><span className="lp-dd-sub">Legal review on demand</span></button>
            </div>
          </div>
        </li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="/about">About</a></li>
      </ul>
      <div className="lp-nav-right">
        <button className="lp-nav-signin" onClick={() => navigate('/sign-in')}>Sign in</button>
        <button className="lp-nav-cta" onClick={goDash}>Get started</button>
      </div>
    </nav>
  );
}

export { goToDashboard };
export default MarketingNav;
