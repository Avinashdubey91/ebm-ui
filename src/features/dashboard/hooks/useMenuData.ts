// src/features/dashboard/hooks/useMenuData.ts
import { useEffect, useState } from "react";
import { fetchSideMenus, fetchSubMenus } from "../../../api/menuService";
import type { SideNavigationMenuDTO } from "../../../types/menuTypes";
import { useAuthContext } from "../../../context/AuthContext";
import { useLocation } from "react-router-dom";

export const useMenuData = () => {
  const [menus, setMenus] = useState<SideNavigationMenuDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isReady } = useAuthContext();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const isLoginPage = path === "/login";

    // 🛑 Don't run unless auth system is initialized
    if (!isReady) return;

    // 🛑 If on login page and user not authenticated, skip and mark done
    if (isLoginPage && !isAuthenticated) {
      console.log("🛑 Skipping menu load on", path);
      setLoading(false);
      return;
    }

    const loadMenus = async () => {
      try {
        const [mainMenus, subMenus] = await Promise.all([
          fetchSideMenus(),
          fetchSubMenus(),
        ]);

        const merged = mainMenus.map((menu) => ({
          ...menu,
          subMenus: subMenus.filter(
            (sub) => sub.sideNavigationMenuId === menu.sideNavigationMenuId
          ),
        }));

        setMenus(merged);
      } catch (err) {
        console.error("❌ Menu Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, [isReady, isAuthenticated, location.pathname]);

  return { menus, loading, isAuthenticated };
};
