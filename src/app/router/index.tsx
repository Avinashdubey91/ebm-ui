import { createBrowserRouter } from 'react-router-dom';
import App from '../../App';
import Login from '../../features/auth/pages/Login';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',           // 👈 Default route
        element: <Login />  // 👈 Renders Login page
      },
      {
        path: 'login',
        element: <Login />
      }
    ]
  }
]);
