import React, { lazy } from 'react';
import type { SideNavigationMenuDTO } from '../types/menuTypes';
import type { RouteObject } from 'react-router-dom';

//const DashboardLayout = lazy(() => import('../features/dashboard/pages/Dashboard'));

// ✅ Map DB ComponentName to real modular paths
const componentMap: Record<string, string> = {
  // 🔒 Users
  CreateUserForm: 'users/pages/CreateUserPage',
  UserListView: 'users/pages/UserListPage',
  UserRoleForm: 'users/pages/UserRoleForm',
  UserRoleMappingForm: 'users/pages/UserRoleMappingForm',

  // 🏢 Property
  ApartmentCreateForm: 'property/pages/ApartmentCreateForm',
  FlatCreateForm: 'property/pages/FlatCreateForm',

  // 🔌 Electricity
  AddMeterReadingForm: 'billing/pages/AddMeterReadingForm',
  GenerateBillForm: 'billing/pages/GenerateBillForm',
  UpdatePaymentForm: 'billing/pages/UpdatePaymentForm',

  ElectricMeterForm: 'electricity/pages/ElectricMeterForm',
  UnitChargeForm: 'electricity/pages/UnitChargeForm',

  // 🛠️ Maintenance
  MaintenanceGroupForm: 'maintenance/pages/MaintenanceGroupForm',
  MaintenanceComponentForm: 'maintenance/pages/MaintenanceComponentForm',
  GroupComponentForm: 'maintenance/pages/GroupComponentForm',

  // 💸 Expenses
  ExpenseCategoryForm: 'expenses/pages/ExpenseCategoryForm',
  ExtraExpenseForm: 'expenses/pages/ExtraExpenseForm',

  // 📋 Navigation
  SideNavigationMenuComponent: 'navigation/pages/SideNavigationMenuComponent',
  SideNavigationSubMenuComponent: 'navigation/pages/SideNavigationSubMenuComponent',
};


export const generateDynamicRoutes = (menus: SideNavigationMenuDTO[]): RouteObject[] => {
  console.log('🧭 generateDynamicRoutes → Received Menus:', menus);

  const dynamicRoutes: RouteObject[] = [];

  for (const menu of menus) {
    if (!menu.routePath) continue;

    const children: RouteObject[] = [];

    for (const submenu of menu.subMenus ?? []) {
      if (!submenu.routePath || !submenu.componentName || !submenu.isActive) continue;

      const modulePath = componentMap[submenu.componentName];
      if (!modulePath) {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ No path mapping found for component: ${submenu.componentName}`);
        }
        continue;
      }
      const LazyComponent = lazy(() =>
        import(/* @vite-ignore */ `../features/${modulePath}`).catch((err) => {
          console.error(`❌ Failed to load component: ${modulePath}`, err);
          return import('../components/NotFoundPlaceholder');
        })
      );

      children.push({
        path: submenu.routePath,
        element: React.createElement(LazyComponent),
      });

      console.log(`📍 Route Added: ${menu.routePath}/${submenu.routePath} → ${modulePath}`);
    }

    if (children.length > 0) {
      children.push({
        path: '*',
        element: React.createElement('div', { style: { padding: '2rem', color: 'red' } }, '404 - Subpage Not Found'),
      });

      dynamicRoutes.push({
        path: menu.routePath.replace(/^\//, ''),
        children,
      });
    }
  }

  return dynamicRoutes;
};
