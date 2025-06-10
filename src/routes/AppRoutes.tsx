// src/routes/AppRoutes.tsx
import type { RouteObject } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Dashboard from '../features/dashboard/pages/Dashboard';
import Login from '../features/auth/pages/Login';

export const baseRoutes: RouteObject[] = [
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard key={Date.now()} />,
        children: [
          {
            path: '',
            element: <div className="px-4 py-4 text-center fw-bold">Welcome to Dashboard</div>,
          }
          // 🧠 Don't hardcode * here — dynamicRoutes will include it
        ]
      }
    ]
  },
  {
    path: '/login',
    element: <Login />,
  }
];