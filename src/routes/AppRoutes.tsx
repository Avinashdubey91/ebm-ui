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
      { path: 'dashboard', element: <Dashboard /> },
      { path: '*', element: <DynamicRoutesWrapper /> }, // ✅ Catch all dynamic subpaths
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]);
