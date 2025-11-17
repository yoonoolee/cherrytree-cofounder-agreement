import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import useUserSync from './hooks/useUserSync';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPagePosition from './components/ResetPagePosition';
import DomainRedirect from './components/DomainRedirect';
import RedirectToLatestProject from './components/RedirectToLatestProject';
import LandingPage from './pages/LandingPage';
import EquityCalculatorPage from './pages/EquityCalculatorPage';
import AttorneyPage from './pages/AttorneyPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SurveyPage from './pages/SurveyPage';
import PreviewPage from './pages/PreviewPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  // Immediate domain redirect before anything else renders
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const hostname = window.location.hostname;
      const path = window.location.pathname;

      // If on my.cherrytree.app root, check auth and redirect accordingly
      if (hostname.includes('my.cherrytree.app') && path === '/') {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            // Logged in: go to dashboard (which redirects to latest project)
            window.location.replace('https://my.cherrytree.app/dashboard');
          } else {
            // Not logged in: go to login page
            window.location.replace('https://my.cherrytree.app/login');
          }
        });
        return () => unsubscribe();
      }
    }
  }, []);

  // Sync Firebase Auth user to Firestore when they log in
  useUserSync();

  return (
    <Router>
      <DomainRedirect />
      <ResetPagePosition />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/equity-calculator" element={<EquityCalculatorPage />} />
        <Route path="/attorney" element={<AttorneyPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RedirectToLatestProject />
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
