// src/AppEntry.tsx
import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useMenuData } from "./features/dashboard/hooks/useMenuData";
import { generateDynamicRoutes } from "./utils/generateRoutes";
import { baseRoutes } from "./routes/AppRoutes";
import { DYNAMIC_MENU_BASE_PATH } from "./constants/routes";

const AppEntry: React.FC = () => {
  const { menus, loading } = useMenuData();

  const router = React.useMemo(() => {
    if (loading) return null;

    const routes = [...baseRoutes];

    const rootRoute = routes.find((r) => r.path === "/");
    const dashboardRoute = rootRoute?.children?.find(
      (c) => c.path === DYNAMIC_MENU_BASE_PATH
    );

    if (dashboardRoute && Array.isArray(dashboardRoute.children)) {
      const dynamicRoutes = generateDynamicRoutes(menus);
      dashboardRoute.children.push(...dynamicRoutes);
    }

    return createBrowserRouter(routes);
  }, [menus, loading]);

  if (loading || !router) return <div>Loading menu...</div>;

  return <RouterProvider router={router} />;
};

export default AppEntry;