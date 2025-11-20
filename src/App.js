import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useUserSync from './hooks/useUserSync';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPagePosition from './components/ResetPagePosition';
import DomainRedirect from './components/DomainRedirect';
import AppRedirect from './components/AppRedirect';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import EquityCalculatorPage from './pages/EquityCalculatorPage';
import AttorneyPage from './pages/AttorneyPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import SurveyPage from './pages/SurveyPage';
import PreviewPage from './pages/PreviewPage';
import SettingsPage from './pages/SettingsPage';

// Component to render different content for root path based on domain
function RootRoute() {
  const hostname = window.location.hostname;
  const isAppDomain = hostname.includes('my.cherrytree.app');

  // On my.cherrytree.app, show AppRedirect which handles auth-based redirect
  // On cherrytree.app, show the marketing landing page
  return isAppDomain ? <AppRedirect /> : <LandingPage />;
}

function App() {
  // Sync Firebase Auth user to Firestore when they log in
  useUserSync();

  return (
    <Router>
      <DomainRedirect />
      <ResetPagePosition />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/equity-calculator" element={<EquityCalculatorPage />} />
        <Route path="/attorney" element={<AttorneyPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/survey/:projectId"
          element={
            <ProtectedRoute>
              <SurveyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/preview/:projectId"
          element={
            <ProtectedRoute>
              <PreviewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
