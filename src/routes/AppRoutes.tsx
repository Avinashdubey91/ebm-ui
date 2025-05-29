import { createBrowserRouter } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Dashboard from '../features/dashboard/pages/Dashboard';
import Login from '../features/auth/pages/Login';
import DynamicRoutesWrapper from './DynamicRoutesWrapper';

export const router = createBrowserRouter([
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
          },
          {
            path: '*',
            element: <DynamicRoutesWrapper />,
          }
        ]
      }
    ]
  },
  {
    path: '/login',
    element: <Login />,
  }
]);
