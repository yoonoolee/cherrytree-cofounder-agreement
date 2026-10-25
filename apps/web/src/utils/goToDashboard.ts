import type { NavigateFunction } from 'react-router';

import { env } from '../lib/env.ts';

/**
 * The marketing site and the app share one bundle but live on different hosts in production,
 * so from a cherrytree.app page the dashboard is a full navigation to the app host.
 */
export function goToDashboard(navigate: NavigateFunction) {
  const isProd = window.location.hostname.includes('cherrytree.app');
  if (isProd) window.location.href = `${env.appUrl}/dashboard`;
  else void navigate('/dashboard', { replace: true });
}
