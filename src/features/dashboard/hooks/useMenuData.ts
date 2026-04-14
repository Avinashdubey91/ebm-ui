import { useEffect, useState } from "react";
import { fetchSideMenus, fetchSubMenus } from "../../../api/menuService";
import type { SideNavigationMenuDTO } from "../../../types/menuTypes";
import { useAuthContext } from "../../../context/AuthContext";

const MENU_CACHE_STORAGE_KEY = "ebm_menu_cache_v1";

let menuCache: SideNavigationMenuDTO[] | null = null;
let menuRequest: Promise<SideNavigationMenuDTO[]> | null = null;

const readMenusFromSessionStorage = (): SideNavigationMenuDTO[] | null => {
  try {
    const raw = sessionStorage.getItem(MENU_CACHE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SideNavigationMenuDTO[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeMenusToSessionStorage = (menus: SideNavigationMenuDTO[]) => {
  try {
    sessionStorage.setItem(MENU_CACHE_STORAGE_KEY, JSON.stringify(menus));
  } catch {
    // ignore storage errors
  }
};

const clearMenusFromSessionStorage = () => {
  try {
    sessionStorage.removeItem(MENU_CACHE_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

const getInitialMenus = (): SideNavigationMenuDTO[] => {
  if (menuCache) return menuCache;

  const persisted = readMenusFromSessionStorage();
  if (persisted && persisted.length > 0) {
    menuCache = persisted;
    return persisted;
  }

  return [];
};

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
  clearMenusFromSessionStorage();
};

export const useMenuData = () => {
  const { isAuthenticated, isReady } = useAuthContext();

  const initialMenus = getInitialMenus();

  const [menus, setMenus] = useState<SideNavigationMenuDTO[]>(initialMenus);
  const [loading, setLoading] = useState<boolean>(
    !initialMenus.length && isReady && isAuthenticated
  );

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

    // If we already have cached menus, use them immediately and refresh in background.
    const cachedMenus = menuCache ?? readMenusFromSessionStorage();
    if (cachedMenus && cachedMenus.length > 0) {
      menuCache = cachedMenus;
      if (isMounted) {
        setMenus(cachedMenus);
        setLoading(false);
      }
    } else if (isMounted) {
      setLoading(true);
    }

    if (!menuRequest) {
      menuRequest = loadMenusFromApi();
    }

    menuRequest
      .then((data) => {
        menuCache = data;
        writeMenusToSessionStorage(data);

        if (isMounted) {
          setMenus(data);
        }
      })
      .catch((err) => {
        console.error("❌ Menu Load Error:", err);

        if (isMounted && !(cachedMenus && cachedMenus.length > 0)) {
          setMenus([]);
        }
      })
      .finally(() => {
        menuRequest = null;

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