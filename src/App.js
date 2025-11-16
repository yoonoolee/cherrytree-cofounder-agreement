import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useUserSync from './hooks/useUserSync';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPagePosition from './components/ResetPagePosition';
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
  // Sync Firebase Auth user to Firestore when they log in
  useUserSync();

  return (
    <Router>
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
