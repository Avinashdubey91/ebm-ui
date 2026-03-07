import { useMemo } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import { baseRoutes } from '../routes/AppRoutes';
import { generateRoutes } from '../utils/generateRoutes';
import { useMenuData } from '../features/dashboard/hooks/useMenuData';
import { DYNAMIC_MENU_BASE_PATH } from '../constants/routes';
import LoaderOverlay from '../components/common/LoaderOverlay';

const AppRoutes = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const { menus, loading, isAuthenticated } = useMenuData();

  const routes = useMemo(() => {
    const newRoutes = [...baseRoutes];

    if (!isLoginPage && isAuthenticated && menus.length > 0) {
      const rootRoute = newRoutes.find((r) => r.path === '/');
      const dashboardRoute = rootRoute?.children?.find(
        (c) => c.path === DYNAMIC_MENU_BASE_PATH
      );

      if (dashboardRoute && Array.isArray(dashboardRoute.children)) {
        const dynamicRoutes = generateRoutes(menus);
        dashboardRoute.children.push(...dynamicRoutes);
      }
    }

    return newRoutes;
  }, [isLoginPage, isAuthenticated, menus]);

  const element = useRoutes(routes);

  const shouldBlockRender = !isLoginPage && (loading || !isAuthenticated || menus.length === 0);
  if (shouldBlockRender) {
    return <LoaderOverlay />;
  }

  return element;
};

export default AppRoutes;
