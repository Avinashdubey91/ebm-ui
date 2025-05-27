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
            element: <div>Welcome to Dashboard</div>,
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
