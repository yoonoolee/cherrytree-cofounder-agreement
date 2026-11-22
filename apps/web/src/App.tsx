import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';

import ProtectedRoute from './components/ProtectedRoute.tsx';
import ResetPagePosition from './components/ResetPagePosition.tsx';
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

function App() {
  return (
    <Router>
      <ResetPagePosition />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/attorney" element={<AttorneyPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/signup/*" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute loading={<ProjectSkeleton />}>
              <Suspense fallback={<ProjectSkeleton />}>
                <ProjectPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
