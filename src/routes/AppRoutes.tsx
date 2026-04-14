import { useContext, useMemo } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import Dashboard from "../features/dashboard/pages/Dashboard";
import Login from "../features/auth/pages/Login";
import PrivateRoute from "../routes/PrivateRoute";
import { generateRoutes } from "../utils/generateRoutes";
import LoaderOverlay from "../components/common/LoaderOverlay";
import { MenuContext } from "../context/MenuContext";

const AppRoutes = () => {
  const menuContext = useContext(MenuContext);

  if (!menuContext) {
    throw new Error("AppRoutes must be used within MenuProvider");
  }

  const { menus, loading, isAuthenticated } = menuContext;
  const hasMenus = menus.length > 0;

  const routes = useMemo<RouteObject[]>(() => {
    let dashboardChildren: RouteObject[] = [];

    if (isAuthenticated) {
      if (hasMenus) {
        const dynamicRoutes = generateRoutes(menus);

        dashboardChildren = [
          {
            index: true,
            element: (
              <div className="px-4 py-4 text-center fw-bold">
                Welcome to Dashboard
              </div>
            ),
          },
          ...dynamicRoutes,
          {
            path: "*",
            element: (
              <div className="alert alert-danger text-center m-5 fw-bold fs-5">
                Route not found
              </div>
            ),
          },
        ];
      } else if (loading) {
        dashboardChildren = [
          {
            index: true,
            element: <LoaderOverlay />,
          },
          {
            path: "*",
            element: <LoaderOverlay />,
          },
        ];
      } else {
        dashboardChildren = [
          {
            index: true,
            element: (
              <div className="px-4 py-4 text-center fw-bold">
                Welcome to Dashboard
              </div>
            ),
          },
          {
            path: "*",
            element: (
              <div className="alert alert-danger text-center m-5 fw-bold fs-5">
                Route not found
              </div>
            ),
          },
        ];
      }
    }

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
            children: dashboardChildren,
          },
        ],
      },
      {
        path: "/login",
        element: <Login />,
      },
    ];
  }, [isAuthenticated, loading, hasMenus, menus]);

  return useRoutes(routes);
};

export default AppRoutes;