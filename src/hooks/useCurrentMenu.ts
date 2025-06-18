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
  const { pathname } = useLocation(); // e.g., /dashboard/property/society/create
  const { menus } = useMenuData();
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error("useCurrentMenu must be used within a MenuProvider");
  }

  const { currentMenu, setCurrentMenu } = context;

  // STEP 1: Normalize route segment
  const routeSegment = pathname.replace("/dashboard", "").split("?")[0]; // e.g., /users/create

  // Normalize /create, /edit, or /edit/:id → /list for matching
  const normalizedRouteSegment = routeSegment.replace( /\/(create|edit)(\/\d+)?$/i,"/list");

  console.log("🧭 Pathname:", pathname);
  console.log("🔁 Normalized Route:", normalizedRouteSegment);

  let matchedMenu: SideNavigationMenuDTO | undefined;
  let matchedSubMenu: SideNavigationSubMenuDTO | undefined;

  for (const menu of menus) {
    if (!menu.subMenus) continue;

    for (const sub of menu.subMenus) {
      const fullSubPath = `${menu.routePath ?? ""}/${sub.routePath ?? ""}`.replace( /\/+/g, "/");

      if (normalizedRouteSegment === fullSubPath) {
        matchedMenu = menu;
        matchedSubMenu = sub;
        console.log("✅ Matched SubMenu:", sub);
        break;
      }
    }

    if (matchedSubMenu) break;
  }

  // STEP 2: fallback to top-level menu match
  if (!matchedSubMenu) {
    matchedMenu = menus.find(
      (m) => `/${m.routePath}` === normalizedRouteSegment
    );
    if (matchedMenu) {
      console.log("🔁 Fallback: matched top-level menu:", matchedMenu.menuName);
    }
  }

  // STEP 3: Update context when menu changes
  useEffect(() => {
    if (
      matchedMenu &&
      matchedMenu.sideNavigationMenuId !== currentMenu?.sideNavigationMenuId
    ) {
      setCurrentMenu(matchedMenu);
      console.log("📌 Context Updated: Current Menu Set:", matchedMenu.menuName);
    }
  }, [matchedMenu, currentMenu, setCurrentMenu]);

  // STEP 4: Format menu name labels
  const rawSubMenuName = matchedSubMenu?.subMenuName ?? matchedMenu?.menuName ?? "Items";
  const cleanSubMenuName = rawSubMenuName.replace(/List$/i, "").trim();
  const pluralMenuName = cleanSubMenuName;
  const singularMenuName = pluralize.singular(pluralMenuName);

  // STEP 5: Generate correct fallback path
  const parentListPath =
    matchedSubMenu && matchedMenu
      ? `/dashboard/${matchedMenu.routePath}/${matchedSubMenu.routePath}`.replace(/\/+/g,"/")
      : matchedMenu?.routePath
      ? `/dashboard/${matchedMenu.routePath}/list`
      : "/dashboard"; // 🛑 used only if absolutely no match

  console.log("📣 Final menu names → Singular:", singularMenuName, "| Plural:", pluralMenuName);
  console.log("🔙 Back path resolved →", parentListPath);

  // ✅ STEP 6: Get 'create' or 'add' submenu if present
  const siblingCreateSubmenu = matchedMenu?.subMenus?.find((sub) => {
    const path = sub.routePath?.toLowerCase() ?? '';

    // Match either:
    // 1. path === 'create' (like user)
    // 2. path ends with '/create' (like society/create)
    return !sub.isDeleted && (path === 'create' || path.endsWith('/create'));
  });

  // ✅ STEP 7: Build dynamic route
  const createRoutePath = siblingCreateSubmenu && matchedMenu
    ? `/dashboard/${matchedMenu.routePath}/${siblingCreateSubmenu.routePath}`.replace(/\/+/g, '/')
    : '';

  return {
    menu: matchedMenu,
    submenu: matchedSubMenu,
    singularMenuName,
    pluralMenuName,
    parentListPath,
    createRoutePath,
  };
};
