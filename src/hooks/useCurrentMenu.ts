import { useLocation } from 'react-router-dom';
import { useMenuData } from '../features/dashboard/hooks/useMenuData';
import pluralize from 'pluralize';
import type { SideNavigationMenuDTO } from '../types/menuTypes';

export const useCurrentMenu = () => {
  const { pathname } = useLocation(); // e.g., "/dashboard/users/create"
  const { menus } = useMenuData();

  // Match routePath like "/users" from "/dashboard/users/create"
  const routeSegment = '/' + pathname.split('/')[2]; // e.g., "/users"

  const menu: SideNavigationMenuDTO | undefined = menus.find(
    (m) => m.routePath === routeSegment
  );

  const pluralMenuName = menu?.menuName ?? 'Items';
  const singularMenuName = menu?.menuName
    ? pluralize.singular(menu.menuName)
    : 'Item';

  return {
    menu,
    singularMenuName,
    pluralMenuName,
  };
};
