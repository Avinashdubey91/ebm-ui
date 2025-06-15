import { useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { useMenuData } from "../features/dashboard/hooks/useMenuData";
import { MenuContext } from "../context/MenuContext";
import pluralize from "pluralize";
import type {
  SideNavigationMenuDTO,
  SideNavigationSubMenuDTO,
} from "../types/menuTypes";

export const useCurrentMenu = () => {
  const { pathname } = useLocation(); // e.g., /dashboard/property/society/list
  const { menus } = useMenuData();
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error("useCurrentMenu must be used within a MenuProvider");
  }

  const { currentMenu, setCurrentMenu } = context;
  const routeSegment = pathname.replace("/dashboard", "").split("?")[0]; // /property/society/list

  console.log("🧭 Current Pathname:", pathname);
  console.log("🧩 Route Segment:", routeSegment);

  let matchedMenu: SideNavigationMenuDTO | undefined;
  let matchedSubMenu: SideNavigationSubMenuDTO | undefined;

  for (const menu of menus) {
    if (!menu.subMenus) continue;

    for (const sub of menu.subMenus) {
      const fullSubPath = `${menu.routePath ?? ""}/${sub.routePath ?? ""}`.replace(/\/+/g, "/");

      console.log("🔍 Checking full submenu path:", fullSubPath);

      if (routeSegment === fullSubPath) {
        matchedMenu = menu;
        matchedSubMenu = sub;
        console.log("✅ Matched SubMenu:", sub);
        break;
      }
    }

    if (matchedSubMenu) break;
  }

  // fallback: try to match menu directly if no subMenu matched
  if (!matchedSubMenu) {
    matchedMenu = menus.find((m) => m.routePath === routeSegment);
    if (matchedMenu) {
      console.log("🔁 Fallback: matched top-level menu:", matchedMenu.menuName);
    }
  }

  useEffect(() => {
    if (
      matchedMenu &&
      matchedMenu.sideNavigationMenuId !== currentMenu?.sideNavigationMenuId
    ) {
      setCurrentMenu(matchedMenu);
      console.log("📌 Context Updated: Current Menu Set:", matchedMenu.menuName);
    }
  }, [matchedMenu, currentMenu, setCurrentMenu]);

  // 🏷 Labels
  const rawSubMenuName = matchedSubMenu?.subMenuName ?? matchedMenu?.menuName ?? "Items";
  const cleanSubMenuName = rawSubMenuName.replace(/List$/i, "").trim(); // Remove "List" if at the end
  const pluralMenuName = cleanSubMenuName;
  const singularMenuName = pluralize.singular(pluralMenuName);

  const parentListPath =
    matchedSubMenu && matchedMenu
      ? `/dashboard${(matchedMenu.routePath ?? "")}/${(matchedSubMenu.routePath ?? "")}/list`.replace(/\/+/g, "/")
      : matchedMenu?.routePath
      ? `/dashboard${matchedMenu.routePath}/list`
      : "/dashboard";

  console.log("📣 Final menu names → Singular:", singularMenuName, "| Plural:", pluralMenuName);

  return {
    menu: matchedMenu,
    submenu: matchedSubMenu,
    singularMenuName,
    pluralMenuName,
    parentListPath,
  };
};
