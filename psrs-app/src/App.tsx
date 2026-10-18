import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { NotificationProvider } from './context/NotificationContext';

// Components
import { OfficialBanner } from './components/OfficialBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Public Pages
import { RequestsDirectoryPage } from './pages/public/RequestsDirectoryPage';
import { RequestTrackingPage } from './pages/public/RequestTrackingPage';
import { RequestHomePage } from './pages/public/RequestHomePage';

// Citizen Pages
import { LoginPage } from './pages/citizen/LoginPage';
import { RegisterPage } from './pages/citizen/RegisterPage';
import { CitizenRequestsDashboard } from './pages/citizen/CitizenRequestsDashboard';
import { SubmitRequestPage } from './pages/citizen/SubmitRequestPage';
import { RequestDetailPage } from './pages/citizen/RequestDetailPage';

// Staff & Admin Pages
import { RequestAdminDashboard } from './pages/admin/RequestAdminDashboard';

// Route Guards
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
        Verifying citizen session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const destination = user.role === 'citizen' ? '/citizen/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page" style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="gov-container page-container" style={{ maxWidth: '500px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>404</h1>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0 14px 0' }}>Page not found</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          The page you requested does not exist.
        </p>
        <a href="/" className="btn btn-primary">Return to Portal Home</a>
      </div>
    </div>
  );
};

export const AppContent: React.FC = () => {
  const location = useLocation();

  React.useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <OfficialBanner />
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RequestHomePage />} />
          <Route path="/requests" element={<RequestsDirectoryPage />} />
          <Route path="/track" element={<RequestTrackingPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Citizen Protected Routes */}
          <Route
            path="/citizen/dashboard"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenRequestsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/requests/new"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <SubmitRequestPage />
              </ProtectedRoute>
            }
          />
          <Route path="/citizen/requests" element={<Navigate to="/citizen/dashboard" replace />} />
          <Route
            path="/citizen/requests/:id"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <RequestDetailPage />
              </ProtectedRoute>
            }
          />
          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RequestAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/requests" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/requests/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RequestDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
