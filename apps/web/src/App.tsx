import { BrowserRouter as Router, Routes, Route } from 'react-router';

import ProtectedRoute from './components/ProtectedRoute.tsx';
import ResetPagePosition from './components/ResetPagePosition.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import LandingPage from './pages/LandingPage.tsx';
import EquityCalculatorPage from './pages/EquityCalculatorPage.tsx';
import AttorneyPage from './pages/AttorneyPage.tsx';
import PricingPage from './pages/PricingPage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import ContactPage from './pages/ContactPage.tsx';
import PrivacyPage from './pages/PrivacyPage.tsx';
import TermsPage from './pages/TermsPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import SignUpPage from './pages/SignUpPage.tsx';
import ProjectPage from './pages/ProjectPage.tsx';

function App() {
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
            <ProtectedRoute>
              <ProjectPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
