import { useLocation, useNavigate } from 'react-router-dom';

import { goToDashboard } from '../utils/goToDashboard.ts';

/** The landing-page section the nav's "How it works" link scrolls to. */
export const HOW_IT_WORKS_ID = 'features-v2';

function MarketingNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const goDash = () => goToDashboard(navigate);

  // "How it works" is a section of the landing page; from any other page, go there first and
  // let LandingPage scroll to the hash once it has mounted.
  const goHowItWorks = () => {
    if (pathname === '/') {
      document.getElementById(HOW_IT_WORKS_ID)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate(`/#${HOW_IT_WORKS_ID}`);
  };

  return (
    <nav className="lp-nav">
      <button className="lp-nav-logo" onClick={() => navigate('/')}>
        <img src="/images/cherries.png" alt="Cherrytree" width={22} height={22} />
        <span className="lp-nav-logo-text">Cherrytree</span>
      </button>
      <ul className="lp-nav-links">
        <li>
          <button type="button" onClick={goHowItWorks}>
            How it works
          </button>
        </li>
        <li>
          <a href="/pricing">Pricing</a>
        </li>
        <li>
          <a href="/about">About</a>
        </li>
      </ul>
      <div className="lp-nav-right">
        <button className="lp-nav-signin" onClick={() => navigate('/login')}>
          Sign in
        </button>
        <button className="lp-nav-cta" onClick={goDash}>
          Get started
        </button>
      </div>
    </nav>
  );
}

export default MarketingNav;
