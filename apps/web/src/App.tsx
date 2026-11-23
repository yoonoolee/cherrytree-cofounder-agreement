import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  ScrollRestoration,
} from 'react-router';

import ProtectedRoute from './components/ProtectedRoute.tsx';
import ProjectSkeleton from './components/status/ProjectSkeleton.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import LandingPage from './pages/LandingPage.tsx';
import AttorneyPage from './pages/AttorneyPage.tsx';
import PricingPage from './pages/PricingPage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import ContactPage from './pages/ContactPage.tsx';
import PrivacyPage from './pages/PrivacyPage.tsx';
import TermsPage from './pages/TermsPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import SignUpPage from './pages/SignUpPage.tsx';

// The agent product loads as its own chunk, so the marketing pages and dashboard don't ship it.
const ProjectPage = lazy(() => import('./pages/ProjectPage.tsx'));

// Every page, in a data router so pages can use its navigation APIs (useBlocker). A new page
// opens at the top; Back and Forward return to where it was scrolled.
const router = createBrowserRouter([
  {
    element: (
      <>
        <ScrollRestoration />
        <Outlet />
      </>
    ),
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/attorney', element: <AttorneyPage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '/login/*', element: <LoginPage /> },
      { path: '/signup/*', element: <SignUpPage /> },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/projects/:projectId',
        element: (
          <ProtectedRoute loading={<ProjectSkeleton />}>
            <Suspense fallback={<ProjectSkeleton />}>
              <ProjectPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
