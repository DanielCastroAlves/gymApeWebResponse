import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from './AuthContext';

export default function RequireAuth({ role }: { role?: UserRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

