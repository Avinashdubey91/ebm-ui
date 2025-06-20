import React, { lazy } from "react";
import type { SideNavigationMenuDTO } from "../types/menuTypes";
import type { RouteObject } from "react-router-dom";

// ✅ Glob import to preload all .tsx pages
const lazyModules = import.meta.glob(
  "../features/**/{pages,forms,shared}/**/*.tsx"
);

// ✅ Map DB ComponentName to actual relative paths
const componentMap: Record<string, string> = {};

for (const path in lazyModules) {
  const match = path.match(/\/([^/]+)\.tsx$/);
  if (match) {
    const componentName = match[1];
    componentMap[componentName] = path;
  }
}

export const generateRoutes = (
  menus: SideNavigationMenuDTO[]
): RouteObject[] => {
  const dynamicRoutes: RouteObject[] = [];

  for (const menu of menus) {
    if (!menu.routePath) continue;

    const children: RouteObject[] = [];

    for (const submenu of menu.subMenus ?? []) {
      if (!submenu.routePath || !submenu.componentName) continue;

      const modulePath = componentMap[submenu.componentName];
      if (!modulePath) continue;

      const loader = lazyModules[componentMap[submenu.componentName]];

      const LazyComponent = loader
        ? lazy(
            loader as () => Promise<{ default: React.ComponentType<unknown> }>
          )
        : lazy(() => import("../components/NotFoundPlaceholder"));

      // Normal Route
      children.push({
        path: submenu.routePath,
        element: React.createElement(LazyComponent),
      });

      // Dynamically generate edit route if routePath matches known patterns
      const editPatterns = ["create", "add"];
      const routeLower = submenu.routePath.toLowerCase();

      const matchedPattern = editPatterns.find(
        (p) => routeLower === p || routeLower.endsWith(`/${p}`)
      );

      if (matchedPattern) {
        const pathSegments = submenu.routePath.split("/").filter(Boolean);
        if (pathSegments.length === 1) {
          // e.g., 'create' → generate 'edit/:id'
          children.push({
            path: `edit/:id`,
            element: React.createElement(LazyComponent),
          });
        } else {
          // e.g., 'society/create' → generate 'society/edit/:id'
          const baseEditPath = submenu.routePath.replace(
            new RegExp(`/${matchedPattern}$`, "i"),
            "/edit"
          );
          children.push({
            path: `${baseEditPath}/:id`,
            element: React.createElement(LazyComponent),
          });
        }
      }
    }

    if (children.length > 0) {
      // Add fallback 404 for unknown subroutes
      children.push({
        path: "*",
        element: React.createElement(
          "div",
          { style: { padding: "2rem", color: "red" } },
          "404 - Subpage Not Found"
        ),
      });

      const routeParts = menu.routePath.replace(/^\//, "").split("/"); // ["dashboard", "users"]

      // If path is "dashboard/users", split to ["dashboard", "users"]
      // Then nest accordingly
      const parent: RouteObject = { path: routeParts[0], children: [] };
      let current = parent;

      for (let i = 1; i < routeParts.length; i++) {
        const newChild = { path: routeParts[i], children: [] };
        current.children!.push(newChild);
        current = newChild;
      }

      current.children!.push(...children);
      dynamicRoutes.push(parent);
    }
  }

  console.log(
    "📌 Final Dynamic Routes:",
    dynamicRoutes.map((r) => ({
      parentPath: r.path,
      children: r.children?.map((c) =>
        typeof c.path === "string" ? c.path : "[no-path]"
      ),
    }))
  );

  return dynamicRoutes;
};
