import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import { OfficialBanner } from './components/OfficialBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ServicesDirectoryPage } from './pages/public/ServicesDirectoryPage';
import { ServiceDetailPage } from './pages/public/ServiceDetailPage';
import { TrackRequestPage } from './pages/public/TrackRequestPage';
import { HelpContactPage } from './pages/public/HelpContactPage';

// Citizen Pages
import { LoginPage } from './pages/citizen/LoginPage';
import { RegisterPage } from './pages/citizen/RegisterPage';
import { ForgotPasswordPage } from './pages/citizen/ForgotPasswordPage';
import { CitizenDashboardPage } from './pages/citizen/CitizenDashboardPage';
import { ApplyServicePage } from './pages/citizen/ApplyServicePage';
import { MyApplicationsPage } from './pages/citizen/MyApplicationsPage';
import { ApplicationDetailPage } from './pages/citizen/ApplicationDetailPage';
import { PaymentsPage } from './pages/citizen/PaymentsPage';
import { ProfilePage } from './pages/citizen/ProfilePage';

// Staff & Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminApplicationsPage } from './pages/admin/AdminApplicationsPage';
import { AdminApplicationReviewPage } from './pages/admin/AdminApplicationReviewPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';

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
    return <Navigate to={user.role === 'citizen' ? '/citizen/dashboard' : '/admin/dashboard'} replace />;
  }

  return <>{children}</>;
};

const NotFoundPage: React.FC = () => {
  return (
    <div style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="gov-container" style={{ maxWidth: '500px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, color: 'var(--gov-navy-900)' }}>404</h1>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0 14px 0' }}>Public Record Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          The requested public portal page or statutory reference could not be located on the PSRS gateway.
        </p>
        <a href="/" className="btn btn-primary">Return to Portal Home</a>
      </div>
    </div>
  );
};

export const AppContent: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <OfficialBanner />
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesDirectoryPage />} />
          <Route path="/services/:idOrSlug" element={<ServiceDetailPage />} />
          <Route path="/track" element={<TrackRequestPage />} />
          <Route path="/help" element={<HelpContactPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Citizen Protected Routes */}
          <Route
            path="/citizen/dashboard"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'staff', 'admin']}>
                <CitizenDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/apply/:serviceId"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'staff', 'admin']}>
                <ApplyServicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/applications"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'staff', 'admin']}>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'staff', 'admin']}>
                <ApplicationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/payments"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'staff', 'admin']}>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/payments/:id"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'staff', 'admin']}>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/profile"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'staff', 'admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Staff & Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <AdminApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications/:id/review"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <AdminApplicationReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <AdminPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnnouncementsPage />
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
