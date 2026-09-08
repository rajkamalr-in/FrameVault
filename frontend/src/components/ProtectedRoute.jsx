import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = sessionStorage.getItem('token');
  const user = authService.getUserFromStorage();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user role if attempting unauthorized page access
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/team" replace />;
    }
  }

  return children;
}
