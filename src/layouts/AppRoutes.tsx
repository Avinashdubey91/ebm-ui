// src/layouts/AppRoutes.tsx
import { useMemo } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import { baseRoutes } from '../routes/AppRoutes';
import { generateDynamicRoutes } from '../utils/generateRoutes';
import { useMenuData } from '../features/dashboard/hooks/useMenuData';
import { DYNAMIC_MENU_BASE_PATH } from '../constants/routes';
import LoaderOverlay from '../components/common/LoaderOverlay';

const AppRoutes = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const { menus, loading, isAuthenticated } = useMenuData();

  // ✅ Always call useMemo unconditionally
  const routes = useMemo(() => {
    const newRoutes = [...baseRoutes];

    if (!isLoginPage && isAuthenticated && menus.length > 0) {
      const rootRoute = newRoutes.find((r) => r.path === '/');
      const dashboardRoute = rootRoute?.children?.find(
        (c) => c.path === DYNAMIC_MENU_BASE_PATH
      );

      if (dashboardRoute && Array.isArray(dashboardRoute.children)) {
        const dynamicRoutes = generateDynamicRoutes(menus);
        dashboardRoute.children.push(...dynamicRoutes);
        console.log('✅ Dynamic routes generated and injected');
      }
    }

    return newRoutes;
  }, [isLoginPage, isAuthenticated, menus]);

  // ✅ Always call useRoutes unconditionally
  const element = useRoutes(routes);

  // ✅ Block render only visually (not hooks)
  const shouldBlockRender = !isLoginPage && (loading || !isAuthenticated || menus.length === 0);
  if (shouldBlockRender) {
    console.log('⏳ Delaying route render until menus + auth are ready');
    return <LoaderOverlay />;
  }

  return element;
};

export default AppRoutes;
