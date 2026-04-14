import { useEffect, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { MenuContext } from "../context/MenuContext";
import pluralize from "pluralize";
import type {
  SideNavigationMenuDTO,
  SideNavigationSubMenuDTO,
} from "../types/menuTypes";

const normalizePath = (value?: string | null): string => {
  if (!value) return "";

  return (
    "/" +
    value
      .replace(/^\//, "")
      .replace(/^dashboard\/?/i, "")
      .replace(/\/+/g, "/")
      .replace(/\/$/, "")
  );
};

export const useCurrentMenu = () => {
  const { pathname } = useLocation();
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error("useCurrentMenu must be used within a MenuProvider");
  }

  const { currentMenu, setCurrentMenu, menus } = context;

  const routeSegment = normalizePath(pathname.replace(/^\/dashboard/i, ""));
  const normalizedRouteSegment = routeSegment.replace(
    /\/(create|edit)(\/\d+)?$/i,
    "/list"
  );

  const matchResult = useMemo(() => {
    let matchedMenu: SideNavigationMenuDTO | undefined;
    let matchedSubMenu: SideNavigationSubMenuDTO | undefined;

    for (const menu of menus) {
      if (!menu.subMenus) continue;

      const normalizedMenuPath = normalizePath(menu.routePath);

      for (const sub of menu.subMenus) {
        const normalizedSubPath = normalizePath(sub.routePath);
        const fullSubPath = `${normalizedMenuPath}${normalizedSubPath}`.replace(
          /\/+/g,
          "/"
        );

        if (normalizedRouteSegment === fullSubPath) {
          matchedMenu = menu;
          matchedSubMenu = sub;
          break;
        }
      }

      if (matchedSubMenu) break;
    }

    if (!matchedSubMenu) {
      matchedMenu = menus.find(
        (m) => normalizePath(m.routePath) === normalizedRouteSegment
      );
    }

    return { matchedMenu, matchedSubMenu };
  }, [menus, normalizedRouteSegment]);

  const { matchedMenu, matchedSubMenu } = matchResult;

  useEffect(() => {
    if (
      matchedMenu &&
      matchedMenu.sideNavigationMenuId !== currentMenu?.sideNavigationMenuId
    ) {
      setCurrentMenu(matchedMenu);
    }
  }, [matchedMenu, currentMenu, setCurrentMenu]);

  const rawSubMenuName =
    matchedSubMenu?.subMenuName ??
    matchedMenu?.menuName ??
    (menus.length === 0 ? "" : "Items");

  const cleanSubMenuName = rawSubMenuName.replace(/List$/i, "").trim();
  const pluralMenuName = cleanSubMenuName;
  const singularMenuName = pluralize.singular(pluralMenuName);

  const parentListPath =
    matchedSubMenu && matchedMenu
      ? `/dashboard${normalizePath(matchedMenu.routePath)}${normalizePath(
          matchedSubMenu.routePath
        )}`.replace(/\/+/g, "/")
      : matchedMenu?.routePath
      ? `/dashboard${normalizePath(matchedMenu.routePath)}/list`.replace(
          /\/+/g,
          "/"
        )
      : "/dashboard";

  const currentBase = (matchedSubMenu?.routePath ?? "")
    .toLowerCase()
    .replace(/\/(list|edit(\/:?\w+)?)$/i, "");

  const siblingCreateSubmenu = matchedMenu?.subMenus?.find((sub) => {
    const subRoute = (sub.routePath ?? "").toLowerCase();
    return subRoute === `${currentBase}/create` || subRoute === "create";
  });

  const createRoutePath =
    siblingCreateSubmenu && matchedMenu
      ? `/dashboard${normalizePath(matchedMenu.routePath)}${normalizePath(
          siblingCreateSubmenu.routePath
        )}`.replace(/\/+/g, "/")
      : "";

  return {
    menu: matchedMenu,
    submenu: matchedSubMenu,
    singularMenuName,
    pluralMenuName,
    parentListPath,
    createRoutePath,
  };
};