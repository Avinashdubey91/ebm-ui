// src/routes/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute: React.FC = () => {
  const token = localStorage.getItem('token');

  // ✅ Show the nested routes if authenticated
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
