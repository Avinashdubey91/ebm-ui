import { useContext, useMemo } from "react";
import { Navigate, useLocation, useRoutes } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import Dashboard from "../features/dashboard/pages/Dashboard";
import Login from "../features/auth/pages/Login";
import PrivateRoute from "../routes/PrivateRoute";
import { generateRoutes } from "../utils/generateRoutes";
import LoaderOverlay from "../components/common/LoaderOverlay";
import { MenuContext } from "../context/MenuContext";

const AppRoutes = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const menuContext = useContext(MenuContext);

  if (!menuContext) {
    throw new Error("AppRoutes must be used within MenuProvider");
  }

  const { menus, loading, isAuthenticated } = menuContext;

  const routes = useMemo<RouteObject[]>(() => {
    const dynamicRoutes =
      !isLoginPage && isAuthenticated && menus.length > 0
        ? generateRoutes(menus)
        : [];

    return [
      {
        path: "/",
        element: <PrivateRoute />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "dashboard/*",
            element: <Dashboard />,
            children: dynamicRoutes,
          },
        ],
      },
      {
        path: "/login",
        element: <Login />,
      },
    ];
  }, [isLoginPage, isAuthenticated, menus]);

  const element = useRoutes(routes);

  const shouldBlockRender = !isLoginPage && isAuthenticated && loading;
  if (shouldBlockRender) {
    return <LoaderOverlay />;
  }

  return element;
};

export default AppRoutes;