import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { UseAuth } from '../context/UseAuth';

const PrivateRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, isReady } = UseAuth();

  // Wait until startup session restore completes before making a routing decision.
  if (!isReady) {
    return null;
  }

  // Redirect only when auth state is fully resolved and user is not authenticated.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default PrivateRoute;