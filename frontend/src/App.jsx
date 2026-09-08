import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeamDashboard from './pages/TeamDashboard';
import PublicGallery from './pages/PublicGallery';
import { authService } from './services/authService';

export default function App() {
  const [user, setUser] = useState(authService.getUserFromStorage());
  const location = useLocation();

  useEffect(() => {
    // Check user validity on initial mount if token present (tab-isolated via sessionStorage)
    const token = sessionStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(userData => {
          setUser(userData);
          sessionStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          authService.logout();
          setUser(null);
        });
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Hide the Navbar entirely on the public customer gallery pages — customers have no account.
  const isPublicGallery = location.pathname.startsWith('/gallery/');

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-gray-900 flex flex-col font-sans">
      {!isPublicGallery && <Navbar user={user} onLogout={handleLogout} />}

      <main className="flex-1">
        <Routes>
          {/* Public Home Page */}
          <Route path="/" element={<Home user={user} />} />

          {/* Authentication Page */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={user.role === 'ADMIN' ? '/admin' : '/team'} replace />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          {/* Customer Public Gallery — no login required, no Navbar */}
          <Route path="/gallery/:shareSlug" element={<PublicGallery />} />

          {/* Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/team"
            element={
              <ProtectedRoute allowedRoles={['TEAM_MEMBER']}>
                <TeamDashboard user={user} />
              </ProtectedRoute>
            }
          />

          {/* Default Fallback Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
