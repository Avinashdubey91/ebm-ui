import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Dashboard from '../features/dashboard/pages/Dashboard';
import Login from '../features/auth/pages/Login';

export const baseRoutes: RouteObject[] = [
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
        children: [
          {
            path: '',
            element: <div className="px-4 py-4 text-center fw-bold">Welcome to Dashboard</div>,
          }
          // Don't hardcode * here — dynamicRoutes will include it
        ]
      }
    ]
  },
  {
    path: '/login',
    element: <Login />,
  }
];