import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useThemeStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ProfilePage from './pages/ProfilePage';

function App() {
  const { isAuthenticated, initAuth, user } = useAuthStore();
  const { isDark, init } = useThemeStore();

  useEffect(() => {
    initAuth();
    init(isDark);
  }, []);

  const getDashboard = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'officer') return '/officer';
    return '/client';
  };

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{ top: 20, right: 20 }}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '16px', // Restored rounded corners
            padding: '16px 20px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#1e293b'
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
            style: { borderLeft: '4px solid #10b981' }
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#fff' },
            style: { borderLeft: '4px solid #f43f5e' }
          }
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login"    element={!isAuthenticated ? <LoginPage />    : <Navigate to={getDashboard()} replace />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to={getDashboard()} replace />} />

        {/* Protected - Admin */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Protected - Client */}
        <Route element={<ProtectedRoute roles={['client', 'admin']} />}>
          <Route element={<Layout />}>
            <Route path="/client" element={<ClientDashboard />} />
          </Route>
        </Route>

        {/* Protected - Officer */}
        <Route element={<ProtectedRoute roles={['officer', 'admin']} />}>
          <Route element={<Layout />}>
            <Route path="/officer" element={<OfficerDashboard />} />
          </Route>
        </Route>

        {/* Protected - Profile */}
        <Route element={<ProtectedRoute roles={['client', 'admin', 'officer']} />}>
          <Route element={<Layout />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Default redirectStatus */}
        <Route path="/" element={isAuthenticated ? <Navigate to={getDashboard()} replace /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
