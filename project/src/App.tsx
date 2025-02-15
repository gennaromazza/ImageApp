import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookingStatusProvider } from './contexts/BookingStatusContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';
import CalendarCallbackPage from './pages/CalendarCallbackPage';
import ProfileLayout from './pages/profile/ProfileLayout';
import ProfilePage from './pages/profile/ProfilePage';
import SecurityPage from './pages/profile/SecurityPage';
import GalleryViewerPage from './pages/GalleryViewerPage';
import FinancialDashboard from './components/admin/FinancialDashboard';

const BASE_PATH = import.meta.env.DEV ? '' : '/carnival2025';

const AppRoutes = () => {
  const auth = useAuth();

  return (
    <Routes>
      {/* Redirect dalla home alla pagina prenotazioni */}
      <Route
        path="/"
        element={<Navigate to="/prenota" replace />}
      />

      {/* Main layout routes */}
      <Route element={<Layout />}>
        {/* Pagina pubblica prenotazioni */}
        <Route path="/prenota" element={<BookingPage />} />

        {/* Admin dashboard */}
        <Route path="/dashboard/*" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
<Route path="/dashboard/admin/financial-dashboard" element={<ProtectedRoute requireAdmin><FinancialDashboard /></ProtectedRoute>} />


        {/* Profile routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileLayout />
            </ProtectedRoute>
          }
        >


          <Route index element={<ProfilePage />} />
          <Route path="security" element={<SecurityPage />} />
        </Route>

        {/* Gallery viewer */}
        <Route path="/gallery/:bookingId" element={<GalleryViewerPage />} />

        {/* Calendar callback */}
        <Route path="/calendar/callback" element={<CalendarCallbackPage />} />

        {/* 404 e catch-all */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter basename={BASE_PATH}>
          <BookingStatusProvider>
            <AppRoutes />
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#333',
                  color: '#fff',
                  borderRadius: '8px',
                },
                success: {
                  iconTheme: {
                    primary: '#FFD700',
                    secondary: '#000',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ff4b4b',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </BookingStatusProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App