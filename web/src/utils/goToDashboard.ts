import type { NavigateFunction } from 'react-router-dom';

import { env } from '../lib/env.ts';

/**
 * The marketing site and the app share one bundle but live on different hosts in production,
 * so from a cherrytree.app page the dashboard is a full navigation to the app host.
 */
export function goToDashboard(navigate: NavigateFunction) {
  const isProd = window.location.hostname.includes('cherrytree.app');
  if (isProd) window.location.href = `${env.appUrl}/dashboard`;
  else navigate('/dashboard', { replace: true });
}
