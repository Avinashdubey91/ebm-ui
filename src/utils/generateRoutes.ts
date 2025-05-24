import React, { lazy } from 'react';
import type { SideNavigationMenuDTO } from '../types/menuTypes';
import type { RouteObject } from 'react-router-dom';

export const generateDynamicRoutes = (menus: SideNavigationMenuDTO[]): RouteObject[] => {
  const dynamicRoutes: RouteObject[] = [];

  for (const menu of menus) {
    if (!menu.routePath) continue;

    for (const submenu of menu.subMenus ?? []) {
      if (!submenu.routePath || !submenu.componentName || !submenu.isActive) continue;

      const fullPath = `${menu.routePath}/${submenu.routePath}`;

      // Use dynamic import inside a closure-safe block
      const LazyComponent = lazy(() =>
        import(/* @vite-ignore */`../features/forms/${submenu.componentName}`)
      );

      dynamicRoutes.push({
        path: fullPath,
        element: React.createElement(LazyComponent), // ✅ instead of <LazyComponent />
      });
    }
  }

  return dynamicRoutes;
};
