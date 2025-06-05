import { useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { useMenuData } from "../features/dashboard/hooks/useMenuData";
import { MenuContext } from "../context/MenuContext";
import pluralize from "pluralize";
import type { SideNavigationMenuDTO } from "../types/menuTypes";

export const useCurrentMenu = () => {
  const { pathname } = useLocation(); // e.g., "/dashboard/users/create"
  const { menus } = useMenuData();
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error("useCurrentMenu must be used within a MenuProvider");
  }

  const { currentMenu, setCurrentMenu } = context;

  // Get "/users" from "/dashboard/users/create"
  const routeSegment = "/" + pathname.split("/")[2];
  const matchedMenu: SideNavigationMenuDTO | undefined = menus.find(
    (m) => m.routePath === routeSegment
  );

  // ✅ Update context when route changes and menu is matched
  useEffect(() => {
    if (
      matchedMenu &&
      matchedMenu.sideNavigationMenuId !== currentMenu?.sideNavigationMenuId // ✅ use correct property
    ) {
      setCurrentMenu(matchedMenu);
    }
  }, [matchedMenu, currentMenu, setCurrentMenu]);

  const pluralMenuName = matchedMenu?.menuName ?? "Items";
  const singularMenuName = matchedMenu?.menuName
    ? pluralize.singular(matchedMenu.menuName)
    : "Item";
  const parentListPath =
    matchedMenu?.parentListPath ??
    (matchedMenu?.routePath ? `/dashboard${matchedMenu.routePath}/list` : '/dashboard');

  return {
    menu: matchedMenu,
    singularMenuName,
    pluralMenuName,
    parentListPath,
  };
};
