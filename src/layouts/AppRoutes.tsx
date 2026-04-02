import { useContext, useMemo } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { baseRoutes } from '../routes/AppRoutes';
import { generateRoutes } from '../utils/generateRoutes';
import { DYNAMIC_MENU_BASE_PATH } from '../constants/routes';
import LoaderOverlay from '../components/common/LoaderOverlay';
import { MenuContext } from '../context/MenuContext';

const AppRoutes = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const menuContext = useContext(MenuContext);

  if (!menuContext) {
    throw new Error('AppRoutes must be used within MenuProvider');
  }

  const { menus, loading, isAuthenticated } = menuContext;

  const routes = useMemo(() => {
    const dynamicRoutes =
      !isLoginPage && isAuthenticated && menus.length > 0
        ? generateRoutes(menus)
        : [];

    const updatedRoutes = baseRoutes.map((route) => {
      if (
        route.path === '/' &&
        route.children?.some((child) => child.path === DYNAMIC_MENU_BASE_PATH)
      ) {
        return {
          ...route,
          children: route.children.map((child) => {
            if (child.path === DYNAMIC_MENU_BASE_PATH) {
              return {
                ...child,
                children: [...(child.children ?? []), ...dynamicRoutes]
              };
            }

            return child;
          })
        };
      }

      return route;
    });

    return updatedRoutes as RouteObject[];
  }, [isLoginPage, isAuthenticated, menus]);

  const element = useRoutes(routes);

  const shouldBlockRender = !isLoginPage && isAuthenticated && loading;
  if (shouldBlockRender) {
    return <LoaderOverlay />;
  }

  return element;
};

export default AppRoutes;