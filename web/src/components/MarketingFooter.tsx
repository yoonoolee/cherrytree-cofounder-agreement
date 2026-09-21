import { useNavigate } from 'react-router-dom';

function MarketingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="lp-footer">
      <div className="lp-footer-top">
        <span className="lp-footer-copy">© 2026 Cherrytree</span>
        <ul className="lp-footer-links">
          <li>
            <button onClick={() => navigate('/privacy')}>Privacy</button>
          </li>
          <li>
            <button onClick={() => navigate('/terms')}>Terms</button>
          </li>
          <li>
            <a href="https://app.hubble.social/timhe" target="_blank" rel="noopener noreferrer">
              Coaching
            </a>
          </li>
          <li>
            <button onClick={() => navigate('/contact')}>Contact</button>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export default MarketingFooter;
