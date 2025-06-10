import React, { lazy } from "react";
import type { SideNavigationMenuDTO } from "../types/menuTypes";
import type { RouteObject } from "react-router-dom";

// ✅ Glob import to preload all .tsx pages
const lazyModules = import.meta.glob("../features/**/pages/**/*.tsx");

// ✅ Map DB ComponentName to actual relative paths
const componentMap: Record<string, string> = {
  // 🔒 Users
  CreateUserForm: "users/pages/CreateUserPage",
  UserListView: "users/pages/UserListPage",
  UserRoleForm: "users/pages/UserRoleForm",
  UserRoleMappingForm: "users/pages/UserRoleMappingForm",

  // 🏢 Property
  ApartmentCreateForm: "property/pages/ApartmentCreateForm",
  FlatCreateForm: "property/pages/FlatCreateForm",

  // 🔌 Electricity
  AddMeterReadingForm: "billing/pages/AddMeterReadingForm",
  GenerateBillForm: "billing/pages/GenerateBillForm",
  UpdatePaymentForm: "billing/pages/UpdatePaymentForm",
  ElectricMeterForm: "electricity/pages/ElectricMeterForm",
  UnitChargeForm: "electricity/pages/UnitChargeForm",

  // 🛠️ Maintenance
  MaintenanceGroupForm: "maintenance/pages/MaintenanceGroupForm",
  MaintenanceComponentForm: "maintenance/pages/MaintenanceComponentForm",
  GroupComponentForm: "maintenance/pages/GroupComponentForm",

  // 💸 Expenses
  ExpenseCategoryForm: "expenses/pages/ExpenseCategoryForm",
  ExtraExpenseForm: "expenses/pages/ExtraExpenseForm",

  // 📋 Navigation
  SideNavigationMenuComponent: "navigation/pages/SideNavigationMenuComponent",
  SideNavigationSubMenuComponent: "navigation/pages/SideNavigationSubMenuComponent",
};

export const generateDynamicRoutes = (
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

      const fullImportPath = `../features/${modulePath}.tsx`;
      const loader = lazyModules[fullImportPath];

      const LazyComponent = loader
        ? lazy(loader as () => Promise<{ default: React.ComponentType<unknown> }>)
        : lazy(() => import("../components/NotFoundPlaceholder"));

      // 🔹 Route for base path
      children.push({
        path: submenu.routePath,
        element: React.createElement(LazyComponent),
      });

      // 🔹 Optional dynamic ID route for forms like /create/:id
      const routeLower = submenu.routePath.toLowerCase();
      const isFormRoute = ["create", "add"].some(
        (p) => routeLower === p || routeLower.startsWith(`${p}-`)
      );

      if (isFormRoute) {
        children.push({
          path: `${submenu.routePath}/:userId`,
          element: React.createElement(LazyComponent),
        });
      }
    }

    if (children.length > 0) {
      // 404 fallback
      children.push({
        path: "*",
        element: React.createElement(
          "div",
          { style: { padding: "2rem", color: "red" } },
          "404 - Subpage Not Found"
        ),
      });

      const routeParts = menu.routePath.replace(/^\//, "").split("/");
      const parent: RouteObject = { path: routeParts[0], children: [] };
      let current = parent;

      for (let i = 1; i < routeParts.length; i++) {
        const newChild: RouteObject = { path: routeParts[i], children: [] };
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
