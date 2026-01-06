import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPagePosition from './components/ResetPagePosition';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import EquityCalculatorPage from './pages/EquityCalculatorPage';
import AttorneyPage from './pages/AttorneyPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SurveyPage from './pages/SurveyPage';
import PreviewPage from './pages/PreviewPage';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </Routes>
    </Router>
  );
}

export default App;
