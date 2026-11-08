import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Stop the browser restoring the old scroll position on refresh, so pages always open at the top.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function ResetPagePosition() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ResetPagePosition;
