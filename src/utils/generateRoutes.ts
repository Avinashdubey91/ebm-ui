import React, { lazy } from "react";
import type { SideNavigationMenuDTO } from "../types/menuTypes";
import type { RouteObject } from "react-router-dom";

const lazyModules = import.meta.glob(
  "../features/**/{pages,forms,shared}/**/*.tsx"
);

const componentMap: Record<string, string> = {};

for (const path in lazyModules) {
  const match = path.match(/\/([^/]+)\.tsx$/);
  if (match) {
    const componentName = match[1];
    componentMap[componentName] = path;
  }
}

const toDashboardRelativePath = (value?: string | null): string => {
  if (!value) return "";

  return value
    .replace(/^\//, "")
    .replace(/^dashboard\/?/i, "")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
};

export const generateRoutes = (
  menus: SideNavigationMenuDTO[]
): RouteObject[] => {
  const dynamicRoutes: RouteObject[] = [];

  for (const menu of menus) {
    const parentPath = toDashboardRelativePath(menu.routePath);
    if (!parentPath) continue;

    const children: RouteObject[] = [];

    for (const submenu of menu.subMenus ?? []) {
      if (!submenu.routePath || !submenu.componentName) continue;

      const modulePath = componentMap[submenu.componentName];
      if (!modulePath) continue;

      const loader = lazyModules[modulePath];

      const LazyComponent = loader
        ? lazy(
            loader as () => Promise<{ default: React.ComponentType<unknown> }>
          )
        : lazy(() => import("../components/NotFoundPlaceholder"));

      const subPath = toDashboardRelativePath(submenu.routePath);
      if (!subPath) continue;

      children.push({
        path: subPath,
        element: React.createElement(LazyComponent),
      });

      const editPatterns = ["create", "add"];
      const routeLower = subPath.toLowerCase();

      const matchedPattern = editPatterns.find(
        (p) => routeLower === p || routeLower.endsWith(`/${p}`)
      );

      if (matchedPattern) {
        const pathSegments = subPath.split("/").filter(Boolean);

        if (pathSegments.length === 1) {
          children.push({
            path: "edit/:id",
            element: React.createElement(LazyComponent),
          });
        } else {
          const baseEditPath = subPath.replace(
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
      children.push({
        path: "*",
        element: React.createElement(
          "div",
          { style: { padding: "2rem", color: "red" } },
          "404 - Subpage Not Found"
        ),
      });

      dynamicRoutes.push({
        path: parentPath,
        children,
      });
    }
  }

  return dynamicRoutes;
};