import { useEffect, useState } from 'react';
import { fetchSideMenus, fetchSubMenus } from '../../../api/menuService';
import type { SideNavigationMenuDTO } from '../../../types/menuTypes';

export const useMenuData = () => {
  const [menus, setMenus] = useState<SideNavigationMenuDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoginPage = window.location.pathname.toLowerCase() === "/login";
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const loadMenus = async () => {
      try {
        const [mainMenus, subMenus] = await Promise.all([
          fetchSideMenus(),
          fetchSubMenus()
        ]);

        const merged = mainMenus.map(menu => ({
          ...menu,
          subMenus: subMenus.filter(
            sub => sub.sideNavigationMenuId === menu.sideNavigationMenuId
          )
        }));

        setMenus(merged);
      } catch (error) {
        console.error('❌ Menu Load Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, []);

  return { menus, loading };
};

