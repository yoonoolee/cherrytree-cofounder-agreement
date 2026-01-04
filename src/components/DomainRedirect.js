import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Get environment-specific domains
const getHostnameFromUrl = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

const APP_DOMAIN = getHostnameFromUrl(process.env.REACT_APP_APP_URL);
const MARKETING_DOMAIN = getHostnameFromUrl(process.env.REACT_APP_MARKETING_URL);

// Define which routes belong to the app (e.g., my.cherrytree.app)
const APP_ROUTES = [
  '/login',     // Login must be on app domain for auth to work
  '/survey',
  '/preview',
  '/settings',
  '/dashboard'
];

// Define which routes belong to the main site (e.g., cherrytree.app)
const MAIN_ROUTES = [
  '/equity-calculator',
  '/pricing',
  '/about',
  '/attorney',
  '/privacy',
  '/terms',
  '/contact'
];

function DomainRedirect() {
  const location = useLocation();

  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const currentHostname = window.location.hostname;
    const currentPath = location.pathname;
    const fullUrl = window.location.href;

    // Don't redirect / (root is handled by App.js)
    if (currentPath === '/') {
      return;
    }

    // Check if we're on an app route
    const isAppRoute = APP_ROUTES.some(route => currentPath.startsWith(route));

    // Check if we're on a main site route
    const isMainRoute = MAIN_ROUTES.some(route => currentPath.startsWith(route));

    // If on app route but not on app domain, redirect
    if (isAppRoute && APP_DOMAIN && !currentHostname.includes(APP_DOMAIN)) {
      const newUrl = fullUrl.replace(currentHostname, APP_DOMAIN);
      window.location.href = newUrl;
      return;
    }

    // If on main route but on app subdomain, redirect to main domain
    if (isMainRoute && APP_DOMAIN && MARKETING_DOMAIN && currentHostname.includes(APP_DOMAIN)) {
      const newUrl = fullUrl.replace(APP_DOMAIN, MARKETING_DOMAIN);
      window.location.href = newUrl;
      return;
    }

  }, [location]);

  return null;
}

export default DomainRedirect;
