import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Define which routes belong to the app (my.cherrytree.app)
const APP_ROUTES = [
  '/survey',
  '/preview',
  '/settings',
  '/dashboard'
];

// Define which routes belong to the main site (cherrytree.app)
const MAIN_ROUTES = [
  '/',
  '/equity-calculator',
  '/pricing',
  '/about',
  '/attorney',
  '/privacy',
  '/terms',
  '/contact',
  '/login'
];

function DomainRedirect() {
  const location = useLocation();

  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    const currentHostname = window.location.hostname;
    const currentPath = location.pathname;
    const fullUrl = window.location.href;

    // Check if we're on an app route
    const isAppRoute = APP_ROUTES.some(route => currentPath.startsWith(route));

    // Check if we're on a main site route
    const isMainRoute = MAIN_ROUTES.some(route =>
      route === '/' ? currentPath === '/' : currentPath.startsWith(route)
    );

    // If on app route but not on my.cherrytree.app, redirect
    if (isAppRoute && !currentHostname.includes('my.cherrytree.app')) {
      const newUrl = fullUrl.replace(currentHostname, 'my.cherrytree.app');
      window.location.href = newUrl;
      return;
    }

    // If on main route but on my.cherrytree.app subdomain, redirect to main domain
    if (isMainRoute && currentHostname.includes('my.cherrytree.app')) {
      const newUrl = fullUrl.replace('my.cherrytree.app', 'cherrytree.app');
      window.location.href = newUrl;
      return;
    }

    // Special case: if on my.cherrytree.app root, redirect to dashboard (which will go to latest project)
    if (currentHostname.includes('my.cherrytree.app') && currentPath === '/') {
      window.location.href = 'https://my.cherrytree.app/dashboard';
    }

  }, [location]);

  return null;
}

export default DomainRedirect;
