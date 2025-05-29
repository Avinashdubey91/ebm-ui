// AppEntry.tsx
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { useMenuData } from './features/dashboard/hooks/useMenuData';
import { generateDynamicRoutes } from './utils/generateRoutes';
import { router as baseRouter } from './routes/AppRoutes';
import { createBrowserRouter } from 'react-router-dom';

const AppEntry: React.FC = () => {
  const { menus, loading } = useMenuData();

  const dynamicRoutes = React.useMemo(() => {
    if (!loading) return generateDynamicRoutes(menus);
    return [];
  }, [menus, loading]);

  if (loading) return <div>Loading menu...</div>;

  const router = createBrowserRouter([
    ...baseRouter.routes.map(route => {
      if (route.path === '/' && route.children) {
        const dashboardRoute = route.children.find(child => child.path === 'dashboard');
        if (dashboardRoute && dashboardRoute.children) {
          dashboardRoute.children.push(...dynamicRoutes);
        }
      }
      return route;
    })
  ]);

  return <RouterProvider router={router} />;
};

export default AppEntry;
