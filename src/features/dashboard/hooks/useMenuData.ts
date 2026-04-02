import { useEffect, useState } from "react";
import { fetchSideMenus, fetchSubMenus } from "../../../api/menuService";
import type { SideNavigationMenuDTO } from "../../../types/menuTypes";
import { useAuthContext } from "../../../context/AuthContext";

let menuCache: SideNavigationMenuDTO[] | null = null;
let menuRequest: Promise<SideNavigationMenuDTO[]> | null = null;

const loadMenusFromApi = async (): Promise<SideNavigationMenuDTO[]> => {
  const [mainMenus, subMenus] = await Promise.all([
    fetchSideMenus(),
    fetchSubMenus(),
  ]);

  return mainMenus.map((menu) => ({
    ...menu,
    subMenus: subMenus.filter(
      (sub) => sub.sideNavigationMenuId === menu.sideNavigationMenuId
    ),
  }));
};

export const clearMenuCache = () => {
  menuCache = null;
  menuRequest = null;
};

export const useMenuData = () => {
  const { isAuthenticated, isReady } = useAuthContext();

  const [menus, setMenus] = useState<SideNavigationMenuDTO[]>(menuCache ?? []);
  const [loading, setLoading] = useState<boolean>(!menuCache);

  useEffect(() => {
    let isMounted = true;

    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      clearMenuCache();
      if (isMounted) {
        setMenus([]);
        setLoading(false);
      }
      return;
    }

    if (menuCache) {
      if (isMounted) {
        setMenus(menuCache);
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    if (!menuRequest) {
      menuRequest = loadMenusFromApi();
    }

    menuRequest
      .then((data) => {
        menuCache = data;
        if (isMounted) {
          setMenus(data);
        }
      })
      .catch((err) => {
        console.error("❌ Menu Load Error:", err);
        if (isMounted) {
          setMenus([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isReady, isAuthenticated]);

  return { menus, loading, isAuthenticated };
};