// Example with react-router-dom v6+
import { createBrowserRouter } from 'react-router-dom';
import PrivateRoute from '../routes/PrivateRoute'; // ✅ Adjust path as needed
import Dashboard from '../features/dashboard/pages/Dashboard';
import Login from '../features/auth/pages/Login';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      // add more protected routes here
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]);
